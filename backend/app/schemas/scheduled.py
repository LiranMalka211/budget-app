from datetime import date, datetime
from typing import Literal

from pydantic import Field, model_validator

from app.schemas.base import CamelModel

Interval = Literal["weekly", "monthly", "yearly"]


class ScheduledTransactionOut(CamelModel):
    """A recurring template as returned to the client."""

    id: str
    title: str
    amount: float
    category_id: str
    type_id: str
    user_id: str
    family_id: str | None = None
    interval: Interval
    day_of_month: int | None = None
    start_date: date
    end_date: date | None = None
    next_run_date: date
    is_active: bool
    created_at: datetime


class ScheduledTransactionInput(CamelModel):
    """Create/update payload."""

    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    category_id: str
    type_id: str
    interval: Interval
    day_of_month: int | None = Field(default=None, ge=1, le=31)
    start_date: date
    end_date: date | None = None

    @model_validator(mode="after")
    def end_after_start(self) -> "ScheduledTransactionInput":
        """Rejects an end date that is not after the start date."""
        if self.end_date and self.end_date <= self.start_date:
            raise ValueError("endDate must be after startDate")
        return self


class ToggleInput(CamelModel):
    """Pause/resume payload."""

    is_active: bool
