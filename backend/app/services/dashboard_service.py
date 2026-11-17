from calendar import monthrange
from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.family import Family
from app.models.scheduled import ScheduledTransaction
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.dashboard import CategoryTotal, DashboardSummary, MonthBudget, MonthlyTotal
from app.schemas.insight import AiInsightOut
from app.schemas.scheduled import ScheduledTransactionOut
from app.schemas.transaction import TransactionOut
from app.services import insight_service
from app.services.permissions import require_edit
from app.services.scheduled_service import materialize_for_user, next_run_after
from app.services.scope import visible_scheduled, visible_transactions
from app.services.seed import TYPE_EXPENSE_ID, TYPE_INCOME_ID


def _month_keys(end: date, count: int) -> list[str]:
    """Returns `count` YYYY-MM keys ending at the month of `end`, oldest first."""
    keys: list[str] = []
    y, m = end.year, end.month
    for _ in range(count):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    return list(reversed(keys))


def build_summary(db: Session, user: User, date_from: date, date_to: date) -> DashboardSummary:
    """Computes totals, category and monthly breakdowns and the widget lists for a date range."""
    materialize_for_user(db, user)
    all_tx = list(db.scalars(visible_transactions(user)).all())
    in_range = [t for t in all_tx if date_from <= t.date <= date_to]

    total_income = sum((float(t.amount) for t in in_range if t.type_id == TYPE_INCOME_ID), 0.0)
    total_expense = sum((float(t.amount) for t in in_range if t.type_id == TYPE_EXPENSE_ID), 0.0)
    fixed_expense = sum(
        (float(t.amount) for t in in_range if t.type_id == TYPE_EXPENSE_ID and t.source == "scheduled"), 0.0
    )

    cat_totals: dict[str, float] = defaultdict(float)
    for t in in_range:
        if t.type_id == TYPE_EXPENSE_ID:
            cat_totals[t.category_id] += float(t.amount)
    categories = {c.id: c for c in db.scalars(select(Category)).all()}
    by_category = sorted(
        (
            CategoryTotal(category_id=cid, category_name=categories[cid].name if cid in categories else cid, total=total)
            for cid, total in cat_totals.items()
        ),
        key=lambda c: c.total,
        reverse=True,
    )

    # Always show at least six months so the cash-flow chart has context even for a short range.
    span_months = (date_to.year - date_from.year) * 12 + (date_to.month - date_from.month) + 1
    months = {k: MonthlyTotal(month=k, income=0.0, expense=0.0) for k in _month_keys(date_to, max(6, span_months))}
    for t in all_tx:
        key = t.date.strftime("%Y-%m")
        if key not in months:
            continue
        if t.type_id == TYPE_INCOME_ID:
            months[key].income += float(t.amount)
        else:
            months[key].expense += float(t.amount)

    recent = sorted(in_range, key=lambda t: (t.date, t.created_at), reverse=True)[:6]
    today = date.today()
    upcoming = db.scalars(
        visible_scheduled(user)
        .where(ScheduledTransaction.is_active.is_(True), ScheduledTransaction.next_run_date >= today)
        .order_by(ScheduledTransaction.next_run_date)
        .limit(5)
    ).all()
    latest = insight_service.latest_generation(db, user)

    return DashboardSummary(
        from_=date_from,
        to=date_to,
        total_income=total_income,
        total_expense=total_expense,
        fixed_expense=fixed_expense,
        variable_expense=total_expense - fixed_expense,
        balance=total_income - total_expense,
        by_category=by_category,
        by_month=list(months.values()),
        recent_transactions=[TransactionOut.model_validate(t) for t in recent],
        upcoming_scheduled=[ScheduledTransactionOut.model_validate(s) for s in upcoming],
        latest_insights=[AiInsightOut.model_validate(i) for i in latest],
        month_budget=_month_budget(db, user, all_tx, today),
    )


def _goal_owner(db: Session, user: User) -> Family | User:
    """Where the savings goal is kept: the family for a shared budget, otherwise the user."""
    if user.family_id:
        family = db.get(Family, user.family_id)
        if family is not None:
            return family
    return user


def _month_budget(db: Session, user: User, all_tx: list[Transaction], today: date) -> MonthBudget:
    """
    This month's figures for the "left to spend" bar. Scheduled payments still due this month are set aside
    (expenses) or counted in (income) before they arrive, so the bar does not jump on the day they run.
    Assumes due schedules were already materialised, so every remaining occurrence is after today.
    """
    start = today.replace(day=1)
    end = today.replace(day=monthrange(today.year, today.month)[1])
    month_tx = [t for t in all_tx if start <= t.date <= end]
    income = sum((float(t.amount) for t in month_tx if t.type_id == TYPE_INCOME_ID), 0.0)
    expense = sum((float(t.amount) for t in month_tx if t.type_id == TYPE_EXPENSE_ID), 0.0)

    expected_income = upcoming_fixed = 0.0
    schedules = db.scalars(visible_scheduled(user).where(ScheduledTransaction.is_active.is_(True))).all()
    for s in schedules:
        run = s.next_run_date
        while run <= end and (s.end_date is None or run <= s.end_date):
            if run >= start:
                if s.type_id == TYPE_INCOME_ID:
                    expected_income += float(s.amount)
                else:
                    upcoming_fixed += float(s.amount)
            run = next_run_after(run, s.interval, s.day_of_month)

    raw_goal = _goal_owner(db, user).savings_goal
    goal = float(raw_goal) if raw_goal is not None else None
    spendable = income + expected_income - (goal or 0.0)
    return MonthBudget(
        month=start.strftime("%Y-%m"),
        goal=goal,
        income=income,
        expected_income=expected_income,
        expense=expense,
        upcoming_fixed=upcoming_fixed,
        spendable=spendable,
        left_to_spend=spendable - expense - upcoming_fixed,
    )


def set_savings_goal(db: Session, user: User, amount: float | None) -> MonthBudget:
    """Sets or clears the monthly savings goal (family members need edit permission) and returns the new bar."""
    require_edit(db, user)
    owner = _goal_owner(db, user)
    owner.savings_goal = Decimal(str(round(amount, 2))) if amount is not None else None
    db.commit()
    materialize_for_user(db, user)
    all_tx = list(db.scalars(visible_transactions(user)).all())
    return _month_budget(db, user, all_tx, date.today())
