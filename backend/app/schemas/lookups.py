from typing import Literal

from pydantic import Field

from app.schemas.base import CamelModel


class TransactionTypeOut(CamelModel):
    """Row of the transaction_types table."""

    id: str
    type: Literal["income", "expense"]


class CategoryOut(CamelModel):
    """Row of the categories table."""

    id: str
    name: str
    type_id: str
    icon: str | None = None


class CreateCategoryInput(CamelModel):
    """Create-category payload."""

    name: str = Field(min_length=1, max_length=100)
    type_id: str
