from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ApiError
from app.models.category import Category, TransactionType
from app.schemas.lookups import CreateCategoryInput


def list_types(db: Session) -> list[TransactionType]:
    """Returns the income/expense rows."""
    return list(db.scalars(select(TransactionType).order_by(TransactionType.type)).all())


def list_categories(db: Session) -> list[Category]:
    """Returns every category, built-in first."""
    return list(db.scalars(select(Category).order_by(Category.is_builtin.desc(), Category.name)).all())


def create_category(db: Session, data: CreateCategoryInput) -> Category:
    """Creates a custom category for the given type."""
    if db.get(TransactionType, data.type_id) is None:
        raise ApiError(400, "invalid_type", "Unknown transaction type")
    category = Category(name=data.name.strip(), type_id=data.type_id, is_builtin=False)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def type_key(db: Session, type_id: str) -> str | None:
    """Returns "income" / "expense" for a type id."""
    row = db.get(TransactionType, type_id)
    return row.type if row else None
