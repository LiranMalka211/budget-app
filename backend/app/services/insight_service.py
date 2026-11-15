import logging
from calendar import monthrange
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.category import Category
from app.models.family import FamilyMember
from app.models.insight import AiInsight
from app.models.scheduled import ScheduledTransaction
from app.models.user import User
from app.services.scope import visible_scheduled, visible_transactions
from app.services.seed import TYPE_EXPENSE_ID, TYPE_INCOME_ID

logger = logging.getLogger(__name__)


@dataclass
class BudgetStats:
    """The numbers the insight generator reasons about, computed for the current month."""

    month_label: str
    income: float
    expense: float
    savings_rate: float
    by_category: list[tuple[str, float]] = field(default_factory=list)  # (name, total) sorted desc
    recurring_count: int = 0
    recurring_total: float = 0.0
    previous_expense: float = 0.0


class _InsightItem(BaseModel):
    """One insight as produced by the model."""

    title: str = Field(max_length=120)
    body: str = Field(max_length=800)


class _InsightList(BaseModel):
    """Structured output schema: exactly the insights to store."""

    insights: list[_InsightItem]


def _humanize(key: str) -> str:
    """Turns a category key like "otherExpense" into "Other expense"."""
    spaced = "".join(f" {c.lower()}" if c.isupper() else c for c in key)
    return spaced[:1].upper() + spaced[1:]


def compute_stats(db: Session, user: User, today: date | None = None) -> BudgetStats:
    """Aggregates the user's visible transactions for the current and previous month."""
    today = today or date.today()
    start = today.replace(day=1)
    end = today.replace(day=monthrange(today.year, today.month)[1])
    prev_end = date.fromordinal(start.toordinal() - 1)  # last day of the previous month
    prev_start = prev_end.replace(day=1)

    txs = list(db.scalars(visible_transactions(user)).all())
    current = [t for t in txs if start <= t.date <= end]
    previous = [t for t in txs if prev_start <= t.date <= prev_end]

    income = sum(float(t.amount) for t in current if t.type_id == TYPE_INCOME_ID)
    expense = sum(float(t.amount) for t in current if t.type_id == TYPE_EXPENSE_ID)
    previous_expense = sum(float(t.amount) for t in previous if t.type_id == TYPE_EXPENSE_ID)

    names = {c.id: c.name for c in db.scalars(select(Category)).all()}
    totals: dict[str, float] = defaultdict(float)
    for t in current:
        if t.type_id == TYPE_EXPENSE_ID:
            totals[_humanize(names.get(t.category_id, t.category_id))] += float(t.amount)

    recurring = db.scalars(
        visible_scheduled(user).where(
            ScheduledTransaction.is_active.is_(True), ScheduledTransaction.type_id == TYPE_EXPENSE_ID
        )
    ).all()

    return BudgetStats(
        month_label=today.strftime("%B %Y"),
        income=income,
        expense=expense,
        savings_rate=max(0.0, (income - expense) / income * 100) if income else 0.0,
        by_category=sorted(totals.items(), key=lambda kv: kv[1], reverse=True),
        recurring_count=len(recurring),
        recurring_total=sum(float(s.amount) for s in recurring),
        previous_expense=previous_expense,
    )


def rule_based_insights(stats: BudgetStats) -> list[tuple[str, str]]:
    """Deterministic insights used when no Anthropic API key is configured or the model call fails."""
    out: list[tuple[str, str]] = []
    if stats.by_category and stats.expense:
        name, total = stats.by_category[0]
        pct = round(total / stats.expense * 100)
        out.append(
            (
                "Biggest spending category",
                f"{name} accounts for {pct}% of your expenses in {stats.month_label}. Setting a monthly cap for it "
                "and reviewing it weekly is the single most effective change you can make.",
            )
        )
    rate = round(stats.savings_rate)
    if stats.income:
        out.append(
            (
                "Savings rate",
                (
                    f"You are saving {rate}% of your income, above the recommended 20%. Consider moving the surplus "
                    "into a dedicated savings account automatically each month."
                    if rate >= 20
                    else f"You are saving {rate}% of your income. Aim for at least 20% by trimming discretionary "
                    "categories such as dining and entertainment."
                ),
            )
        )
    if stats.recurring_count:
        out.append(
            (
                "Recurring commitments",
                f"You have {stats.recurring_count} recurring payments totalling ₪{stats.recurring_total:,.0f} per month. "
                "Review each subscription and cancel the ones you no longer use.",
            )
        )
    if stats.previous_expense and stats.expense:
        change = (stats.expense - stats.previous_expense) / stats.previous_expense * 100
        direction = "more" if change > 0 else "less"
        out.append(
            (
                "Month over month",
                f"So far you have spent {abs(round(change))}% {direction} than last month. "
                + ("Check whether a one-off purchase explains the jump." if change > 10 else "Keep it up."),
            )
        )
    if not out:
        out.append(("Not enough data yet", "Add a few weeks of income and expenses and generate insights again."))
    return out


def _stats_prompt(stats: BudgetStats) -> str:
    """Formats the stats as a compact brief for the model."""
    cats = "\n".join(f"- {name}: ₪{total:,.0f}" for name, total in stats.by_category[:10]) or "- none"
    return (
        f"Month: {stats.month_label}\n"
        f"Income: ₪{stats.income:,.0f}\nExpenses: ₪{stats.expense:,.0f}\n"
        f"Savings rate: {stats.savings_rate:.0f}%\n"
        f"Previous month expenses: ₪{stats.previous_expense:,.0f}\n"
        f"Active recurring expenses: {stats.recurring_count} totalling ₪{stats.recurring_total:,.0f}/month\n"
        f"Expenses by category:\n{cats}"
    )


def claude_insights(stats: BudgetStats) -> list[tuple[str, str]] | None:
    """
    Asks Claude for 3-4 concrete, personalised recommendations as structured JSON.
    Returns None when no key is configured, the request fails, or the model declines, so the caller can fall back.
    """
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=60.0)
        response = client.messages.parse(
            model=settings.anthropic_model,
            max_tokens=4000,
            output_config={"effort": "medium"},
            system=(
                "You are a friendly personal-finance coach for an Israeli family budget app (currency ILS, ₪). "
                "Given this month's figures, write 3 to 4 short, specific, actionable insights that help the family "
                "improve its finances. Each insight has a title (max 8 words) and a body of 2-3 sentences that "
                "quotes the relevant numbers. Be encouraging and concrete; do not give investment advice."
            ),
            messages=[{"role": "user", "content": _stats_prompt(stats)}],
            output_format=_InsightList,
        )
        if response.stop_reason == "refusal" or response.parsed_output is None:
            return None
        return [(i.title, i.body) for i in response.parsed_output.insights][:4]
    except Exception:  # noqa: BLE001 - any failure degrades to rule-based insights
        logger.exception("Claude insight generation failed; using rule-based insights")
        return None


def list_insights(db: Session, user: User) -> list[AiInsight]:
    """Insights created by anyone in the user's family (or just the user), newest first."""
    if user.family_id:
        user_ids = db.scalars(
            select(FamilyMember.user_id).where(
                FamilyMember.family_id == user.family_id, FamilyMember.status == "approved"
            )
        ).all()
    else:
        user_ids = [user.id]
    return list(
        db.scalars(select(AiInsight).where(AiInsight.user_id.in_(user_ids)).order_by(AiInsight.created_at.desc())).all()
    )


def generate_insights(db: Session, user: User) -> list[AiInsight]:
    """Computes this month's stats, asks Claude (or the rule engine) and stores the resulting insights."""
    stats = compute_stats(db, user)
    items = claude_insights(stats) or rule_based_insights(stats)
    created = [AiInsight(title=title, body=body, user_id=user.id) for title, body in items]
    db.add_all(created)
    db.commit()
    for i in created:
        db.refresh(i)
    return created
