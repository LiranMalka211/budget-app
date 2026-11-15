from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.lookups import CategoryOut, CreateCategoryInput, TransactionTypeOut
from app.services import lookup_service

router = APIRouter(tags=["lookups"])


@router.get("/transaction-types", response_model=list[TransactionTypeOut])
def transaction_types(db: DbSession, _: CurrentUser) -> list[TransactionTypeOut]:
    """Lists the income/expense types."""
    return [TransactionTypeOut.model_validate(t) for t in lookup_service.list_types(db)]


@router.get("/categories", response_model=list[CategoryOut])
def categories(db: DbSession, _: CurrentUser) -> list[CategoryOut]:
    """Lists all categories."""
    return [CategoryOut.model_validate(c) for c in lookup_service.list_categories(db)]


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(data: CreateCategoryInput, db: DbSession, _: CurrentUser) -> CategoryOut:
    """Creates a custom category."""
    return CategoryOut.model_validate(lookup_service.create_category(db, data))
