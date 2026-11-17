from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.dashboard import DashboardSummary, MonthBudget, SavingsGoalInput
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(
    user: CurrentUser,
    db: DbSession,
    from_: Annotated[date, Query(alias="from")],
    to: date,
) -> DashboardSummary:
    """Totals, breakdowns and widgets for a date range."""
    return dashboard_service.build_summary(db, user, from_, to)


@router.put("/savings-goal", response_model=MonthBudget)
def set_savings_goal(data: SavingsGoalInput, user: CurrentUser, db: DbSession) -> MonthBudget:
    """Sets (or with null clears) how much should be left at the end of each month; returns this month's bar."""
    return dashboard_service.set_savings_goal(db, user, data.amount)
