from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import new_id


class TransactionType(Base):
    """Lookup table with exactly two rows: income and expense."""

    __tablename__ = "transaction_types"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    type: Mapped[str] = mapped_column(String(20), unique=True)


class Category(Base):
    """A spending/income category. Built-in rows use an i18n key as `name`; user-created rows a plain name."""

    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(100))
    type_id: Mapped[str] = mapped_column(String(36), ForeignKey("transaction_types.id"))
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_builtin: Mapped[bool] = mapped_column(default=False)
