from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.transaction import Paged, TransactionInput, TransactionOut
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=Paged[TransactionOut])
def list_transactions(
    user: CurrentUser,
    db: DbSession,
    from_: Annotated[date | None, Query(alias="from")] = None,
    to: date | None = None,
    type_id: Annotated[str | None, Query(alias="typeId")] = None,
    category_id: Annotated[str | None, Query(alias="categoryId")] = None,
    search: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=200)] = 20,
) -> Paged[TransactionOut]:
    """Paged, filtered list of the user's visible transactions, newest first."""
    items, total = transaction_service.list_transactions(
        db,
        user,
        date_from=from_,
        date_to=to,
        type_id=type_id,
        category_id=category_id,
        search=search,
        page=page,
        page_size=page_size,
    )
    return Paged(items=[TransactionOut.model_validate(t) for t in items], total=total, page=page, page_size=page_size)


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(data: TransactionInput, user: CurrentUser, db: DbSession) -> TransactionOut:
    """Creates a transaction."""
    return TransactionOut.model_validate(transaction_service.create_transaction(db, user, data))


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(tx_id: str, data: TransactionInput, user: CurrentUser, db: DbSession) -> TransactionOut:
    """Updates a transaction."""
    return TransactionOut.model_validate(transaction_service.update_transaction(db, user, tx_id, data))


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: str, user: CurrentUser, db: DbSession) -> None:
    """Deletes a transaction."""
    transaction_service.delete_transaction(db, user, tx_id)
