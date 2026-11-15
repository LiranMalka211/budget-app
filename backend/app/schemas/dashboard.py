from datetime import date

from pydantic import Field

from app.schemas.base import CamelModel
from app.schemas.insight import AiInsightOut
from app.schemas.scheduled import ScheduledTransactionOut
from app.schemas.transaction import TransactionOut


class CategoryTotal(CamelModel):
    """Expense total for one category."""

    category_id: str
    category_name: str
    total: float


class MonthlyTotal(CamelModel):
    """Income and expense totals for one month (YYYY-MM)."""

    month: str
    income: float
    expense: float


class DashboardSummary(CamelModel):
    """Everything the dashboard renders for a date range."""

    from_: date = Field(alias="from")
    to: date
    total_income: float
    total_expense: float
    balance: float
    by_category: list[CategoryTotal]
    by_month: list[MonthlyTotal]
    recent_transactions: list[TransactionOut]
    upcoming_scheduled: list[ScheduledTransactionOut]
    latest_insight: AiInsightOut | None = None
