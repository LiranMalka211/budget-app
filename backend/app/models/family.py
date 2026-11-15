from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.common import new_id, utcnow
from app.models.user import User


class Family(Base):
    """A shared budget group. The head approves and removes members."""

    __tablename__ = "families"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(120))
    invite_key: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    head_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class FamilyMember(Base):
    """Link between a user and a family; `status` is "pending" until the head approves."""

    __tablename__ = "family_members"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    family_id: Mapped[str] = mapped_column(String(36), ForeignKey("families.id", ondelete="CASCADE"), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(lazy="joined")
