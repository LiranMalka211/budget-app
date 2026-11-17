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


class MonthBudget(CamelModel):
    """
    The current month against the savings goal, for the "left to spend" bar. Always the calendar month that
    contains today, whatever range the dashboard shows.
    """

    month: str  # YYYY-MM
    goal: float | None
    income: float  # received so far this month
    expected_income: float  # scheduled income still due this month
    expense: float  # spent so far this month
    upcoming_fixed: float  # scheduled expenses still due this month, set aside in advance
    # income + expected_income - goal: what may be spent this month while keeping the goal.
    spendable: float
    # spendable - expense - upcoming_fixed; negative means the goal is no longer reachable.
    left_to_spend: float


class SavingsGoalInput(CamelModel):
    """A new monthly savings goal; null removes it."""

    amount: float | None = Field(default=None, ge=0, le=100_000_000)


class DashboardSummary(CamelModel):
    """Everything the dashboard renders for a date range."""

    from_: date = Field(alias="from")
    to: date
    total_income: float
    total_expense: float
    # Expenses created by scheduled payments vs everything else, in the range.
    fixed_expense: float = 0.0
    variable_expense: float = 0.0
    balance: float
    by_category: list[CategoryTotal]
    by_month: list[MonthlyTotal]
    recent_transactions: list[TransactionOut]
    upcoming_scheduled: list[ScheduledTransactionOut]
    # The newest generation, in every language; the client shows the rows in its own language.
    latest_insights: list[AiInsightOut] = []
    month_budget: MonthBudget
