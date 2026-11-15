from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import new_id, utcnow


class Transaction(Base):
    """A single income or expense. `amount` is always positive; `type_id` says which direction."""

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    date: Mapped[date] = mapped_column(Date, index=True)
    title: Mapped[str] = mapped_column(String(200))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id"))
    type_id: Mapped[str] = mapped_column(String(36), ForeignKey("transaction_types.id"))
    family_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("families.id"), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
