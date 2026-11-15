from datetime import date, datetime
from typing import Generic, Literal, TypeVar

from pydantic import Field

from app.schemas.base import CamelModel

T = TypeVar("T")


class TransactionOut(CamelModel):
    """A transaction as returned to the client."""

    id: str
    date: date
    title: str
    amount: float
    user_id: str
    category_id: str
    type_id: str
    family_id: str | None = None
    source: Literal["manual", "scheduled", "import"]
    note: str | None = None
    created_at: datetime


class TransactionInput(CamelModel):
    """Create/update payload."""

    date: date
    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    category_id: str
    type_id: str
    note: str | None = None


class Paged(CamelModel, Generic[T]):
    """Generic paged list."""

    items: list[T]
    total: int
    page: int
    page_size: int
