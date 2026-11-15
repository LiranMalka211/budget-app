from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import new_id, utcnow


class ScheduledTransaction(Base):
    """A recurring template; a job turns it into real transactions each time `next_run_date` passes."""

    __tablename__ = "scheduled_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(200))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id"))
    type_id: Mapped[str] = mapped_column(String(36), ForeignKey("transaction_types.id"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    family_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("families.id"), nullable=True, index=True)
    interval: Mapped[str] = mapped_column(String(20))  # weekly | monthly | yearly
    day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_run_date: Mapped[date] = mapped_column(Date, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
