from datetime import date
from typing import Literal

from pydantic import Field

from app.schemas.base import CamelModel


class CommitImportRow(CamelModel):
    """One reviewed row from the frontend import wizard."""

    date: date
    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    type: Literal["income", "expense"]
    category_id: str = ""


class CommitImportInput(CamelModel):
    """Payload persisting a reviewed import."""

    file_name: str = Field(max_length=255)
    source: Literal["bank", "credit", "other"]
    rows: list[CommitImportRow]


class ImportResult(CamelModel):
    """Counts reported after an import."""

    batch_id: str
    inserted: int
    skipped_duplicates: int
