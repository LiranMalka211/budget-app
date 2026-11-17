from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import new_id, utcnow


class User(Base):
    """A registered user. `family_id` is set once they are an approved member of a family."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    family_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("families.id", ondelete="SET NULL", use_alter=True, name="users_family_id_fkey"), nullable=True
    )
    # Monthly savings goal for a personal budget (a family keeps its own on `families`).
    savings_goal: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
