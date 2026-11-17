import logging
from calendar import monthrange
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.category import Category
from app.models.common import utcnow
from app.models.family import FamilyMember
from app.models.insight import AiInsight
from app.models.scheduled import ScheduledTransaction
from app.models.user import User
from app.services.scope import visible_scheduled, visible_transactions
from app.services.seed import TYPE_EXPENSE_ID, TYPE_INCOME_ID

logger = logging.getLogger(__name__)

# Every generation is stored once per language, so the UI can follow the language the user picked.
LANGUAGES = ("en", "he")

# Built-in category keys (seed.BUILTIN_CATEGORIES) in Hebrew; custom categories keep the name the user gave them.
_CATEGORY_HE = {
    "salary": "משכורת",
    "bonus": "בונוס",
    "otherIncome": "הכנסה אחרת",
    "groceries": "סופר",
    "rent": "שכר דירה ומשכנתא",
    "utilities": "חשבונות",
    "transport": "תחבורה",
    "dining": "מסעדות",
    "entertainment": "בילויים",
    "health": "בריאות",
    "education": "חינוך",
    "shopping": "קניות",
    "insurance": "ביטוח",
    "savings": "חיסכון",
    "otherExpense": "אחר",
}
_MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]
_MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]  # fmt: skip

# Rows stamped within this window of the newest row belong to the same generation (its items are stamped a few
# microseconds apart; two generations are always further apart than this).
GENERATION_WINDOW = timedelta(milliseconds=1)

# One insight in every language: {"en": (title, body), "he": (title, body)}.
Insight = dict[str, tuple[str, str]]


@dataclass
class BudgetStats:
    """The numbers the insight generator reasons about, computed for the current month."""

    month: date
    income: float
    expense: float
    savings_rate: float
    by_category: list[tuple[str, float]] = field(default_factory=list)  # (category key or name, total) sorted desc
    recurring_count: int = 0
    recurring_total: float = 0.0
    previous_expense: float = 0.0


class _InsightItem(BaseModel):
    """One insight as produced by the model, written in both languages."""

    title_en: str = Field(max_length=120)
    body_en: str = Field(max_length=800)
    title_he: str = Field(max_length=120)
    body_he: str = Field(max_length=800)


class _InsightList(BaseModel):
    """Structured output schema: exactly the insights to store."""

    insights: list[_InsightItem]


def _humanize(key: str) -> str:
    """Turns a category key like "otherExpense" into "Other expense"."""
    spaced = "".join(f" {c.lower()}" if c.isupper() else c for c in key)
    return spaced[:1].upper() + spaced[1:]


def category_label(key: str, lang: str) -> str:
    """A category's display name in the given language."""
    if lang == "he":
        return _CATEGORY_HE.get(key, key)
    return _humanize(key)


def month_label(d: date, lang: str) -> str:
    """The month and year in words, e.g. "November 2026" or "נובמבר 2026"."""
    names = _MONTHS_HE if lang == "he" else _MONTHS_EN
    return f"{names[d.month - 1]} {d.year}"


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
            totals[names.get(t.category_id, t.category_id)] += float(t.amount)

    recurring = db.scalars(
        visible_scheduled(user).where(
            ScheduledTransaction.is_active.is_(True), ScheduledTransaction.type_id == TYPE_EXPENSE_ID
        )
    ).all()

    return BudgetStats(
        month=start,
        income=income,
        expense=expense,
        savings_rate=max(0.0, (income - expense) / income * 100) if income else 0.0,
        by_category=sorted(totals.items(), key=lambda kv: kv[1], reverse=True),
        recurring_count=len(recurring),
        recurring_total=sum(float(s.amount) for s in recurring),
        previous_expense=previous_expense,
    )


def rule_based_insights(stats: BudgetStats) -> list[Insight]:
    """Deterministic insights in every language, used when no Anthropic API key is configured or the call fails."""
    out: list[Insight] = []
    if stats.by_category and stats.expense:
        key, total = stats.by_category[0]
        pct = round(total / stats.expense * 100)
        out.append(
            {
                "en": (
                    "Biggest spending category",
                    f"{category_label(key, 'en')} accounts for {pct}% of your expenses in "
                    f"{month_label(stats.month, 'en')}. Setting a monthly cap for it and reviewing it weekly is the "
                    "single most effective change you can make.",
                ),
                "he": (
                    "קטגוריית ההוצאה הגדולה",
                    f"{category_label(key, 'he')} היא {pct}% מההוצאות שלכם ב{month_label(stats.month, 'he')}. "
                    "הגדרת תקרה חודשית לקטגוריה הזו ובדיקה שבועית שלה הם השינוי האפקטיבי ביותר שאפשר לעשות.",
                ),
            }
        )
    rate = round(stats.savings_rate)
    if stats.income:
        good = rate >= 20
        out.append(
            {
                "en": (
                    "Savings rate",
                    f"You are saving {rate}% of your income, above the recommended 20%. Consider moving the surplus "
                    "into a dedicated savings account automatically each month."
                    if good
                    else f"You are saving {rate}% of your income. Aim for at least 20% by trimming discretionary "
                    "categories such as dining and entertainment.",
                ),
                "he": (
                    "שיעור החיסכון",
                    f"אתם חוסכים {rate}% מההכנסה, מעל ל-20% המומלצים. כדאי להעביר את העודף אוטומטית "
                    "לחשבון חיסכון ייעודי בכל חודש."
                    if good
                    else f"אתם חוסכים {rate}% מההכנסה. כדאי לשאוף ל-20% לפחות, למשל בקיצוץ בהוצאות גמישות "
                    "כמו מסעדות ובילויים.",
                ),
            }
        )
    if stats.recurring_count:
        total = f"₪{stats.recurring_total:,.0f}"
        out.append(
            {
                "en": (
                    "Recurring commitments",
                    f"You have {stats.recurring_count} recurring payments totalling {total} per month. "
                    "Review each subscription and cancel the ones you no longer use.",
                ),
                "he": (
                    "התחייבויות קבועות",
                    f"יש לכם {stats.recurring_count} תשלומים קבועים בסך {total} בחודש. "
                    "עברו על כל מנוי ובטלו את אלה שאתם כבר לא משתמשים בהם.",
                ),
            }
        )
    if stats.previous_expense and stats.expense:
        change = (stats.expense - stats.previous_expense) / stats.previous_expense * 100
        pct = abs(round(change))
        jump = change > 10
        out.append(
            {
                "en": (
                    "Month over month",
                    f"So far you have spent {pct}% {'more' if change > 0 else 'less'} than last month. "
                    + ("Check whether a one-off purchase explains the jump." if jump else "Keep it up."),
                ),
                "he": (
                    "השוואה לחודש הקודם",
                    f"עד עכשיו הוצאתם {pct}% {'יותר' if change > 0 else 'פחות'} מבחודש שעבר. "
                    + ("כדאי לבדוק אם רכישה חד-פעמית מסבירה את הקפיצה." if jump else "המשיכו כך."),
                ),
            }
        )
    if not out:
        out.append(
            {
                "en": ("Not enough data yet", "Add a few weeks of income and expenses and generate insights again."),
                "he": ("אין עדיין מספיק נתונים", "הוסיפו כמה שבועות של הכנסות והוצאות וצרו תובנות שוב."),
            }
        )
    return out


def _stats_prompt(stats: BudgetStats) -> str:
    """Formats the stats as a compact brief for the model."""
    cats = "\n".join(f"- {_humanize(name)}: ₪{total:,.0f}" for name, total in stats.by_category[:10]) or "- none"
    return (
        f"Month: {month_label(stats.month, 'en')}\n"
        f"Income: ₪{stats.income:,.0f}\nExpenses: ₪{stats.expense:,.0f}\n"
        f"Savings rate: {stats.savings_rate:.0f}%\n"
        f"Previous month expenses: ₪{stats.previous_expense:,.0f}\n"
        f"Active recurring expenses: {stats.recurring_count} totalling ₪{stats.recurring_total:,.0f}/month\n"
        f"Expenses by category:\n{cats}"
    )


def claude_insights(stats: BudgetStats) -> list[Insight] | None:
    """
    Asks Claude for 3-4 concrete, personalised recommendations as structured JSON, each in English and Hebrew.
    Returns None when no key is configured, the request fails, or the model declines, so the caller can fall back.
    """
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=90.0)
        response = client.messages.parse(
            model=settings.anthropic_model,
            max_tokens=8000,
            output_config={"effort": "medium"},
            system=(
                "You are a friendly personal-finance coach for an Israeli family budget app (currency ILS, ₪). "
                "Given this month's figures, write 3 to 4 short, specific, actionable insights that help the family "
                "improve its finances. Each insight has a title (max 8 words) and a body of 2-3 sentences that "
                "quotes the relevant numbers. Be encouraging and concrete; do not give investment advice. "
                "Write every insight twice with the same content and numbers: in English (title_en, body_en) and "
                "in natural, fluent Hebrew addressed to the family in the plural (title_he, body_he)."
            ),
            messages=[{"role": "user", "content": _stats_prompt(stats)}],
            output_format=_InsightList,
        )
        if response.stop_reason == "refusal" or response.parsed_output is None:
            return None
        items = [{"en": (i.title_en, i.body_en), "he": (i.title_he, i.body_he)} for i in response.parsed_output.insights]
        return items[:4] or None
    except Exception:  # noqa: BLE001 - any failure degrades to rule-based insights
        logger.exception("Claude insight generation failed; using rule-based insights")
        return None


def _scope_user_ids(db: Session, user: User) -> list[str]:
    """The user, or every approved member of the user's family."""
    if not user.family_id:
        return [user.id]
    return list(
        db.scalars(
            select(FamilyMember.user_id).where(
                FamilyMember.family_id == user.family_id, FamilyMember.status == "approved"
            )
        ).all()
    )


def list_insights(db: Session, user: User) -> list[AiInsight]:
    """Insights created by anyone in the user's family (or just the user), in every language, newest first."""
    return list(
        db.scalars(
            select(AiInsight)
            .where(AiInsight.user_id.in_(_scope_user_ids(db, user)))
            .order_by(AiInsight.created_at.desc(), AiInsight.id)
        ).all()
    )


def latest_generation(db: Session, user: User) -> list[AiInsight]:
    """Every row of the newest generation, in every language."""
    rows = list_insights(db, user)
    if not rows:
        return []
    newest = rows[0].created_at
    return [r for r in rows if newest - r.created_at < GENERATION_WINDOW]


def generate_insights(db: Session, user: User) -> list[AiInsight]:
    """Computes this month's stats, asks Claude (or the rule engine) and stores the insights in every language."""
    stats = compute_stats(db, user)
    items = claude_insights(stats) or rule_based_insights(stats)
    now = utcnow()
    # Item k is stamped k microseconds earlier, so newest-first keeps the generated order; both languages share it.
    created = [
        AiInsight(
            title=item[lang][0],
            body=item[lang][1],
            language=lang,
            user_id=user.id,
            created_at=now - timedelta(microseconds=k),
        )
        for lang in LANGUAGES
        for k, item in enumerate(items)
    ]
    db.add_all(created)
    db.commit()
    for i in created:
        db.refresh(i)
    return created
