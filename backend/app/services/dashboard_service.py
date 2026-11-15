from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.scheduled import ScheduledTransaction
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.dashboard import CategoryTotal, DashboardSummary, MonthlyTotal
from app.schemas.insight import AiInsightOut
from app.schemas.scheduled import ScheduledTransactionOut
from app.schemas.transaction import TransactionOut
from app.services import insight_service
from app.services.scheduled_service import materialize_for_user
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
    latest = insight_service.list_insights(db, user)[:1]

    return DashboardSummary(
        from_=date_from,
        to=date_to,
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        by_category=by_category,
        by_month=list(months.values()),
        recent_transactions=[TransactionOut.model_validate(t) for t in recent],
        upcoming_scheduled=[ScheduledTransactionOut.model_validate(s) for s in upcoming],
        latest_insight=AiInsightOut.model_validate(latest[0]) if latest else None,
    )
