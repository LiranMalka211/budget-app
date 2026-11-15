from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.scheduled import ScheduledTransactionInput, ScheduledTransactionOut, ToggleInput
from app.services import scheduled_service

router = APIRouter(prefix="/scheduled-transactions", tags=["scheduled"])


@router.get("", response_model=list[ScheduledTransactionOut])
def list_scheduled(user: CurrentUser, db: DbSession) -> list[ScheduledTransactionOut]:
    """Lists recurring templates, next run first."""
    return [ScheduledTransactionOut.model_validate(s) for s in scheduled_service.list_scheduled(db, user)]


@router.post("", response_model=ScheduledTransactionOut, status_code=201)
def create_scheduled(data: ScheduledTransactionInput, user: CurrentUser, db: DbSession) -> ScheduledTransactionOut:
    """Creates a recurring template."""
    return ScheduledTransactionOut.model_validate(scheduled_service.create_scheduled(db, user, data))


@router.put("/{scheduled_id}", response_model=ScheduledTransactionOut)
def update_scheduled(
    scheduled_id: str, data: ScheduledTransactionInput, user: CurrentUser, db: DbSession
) -> ScheduledTransactionOut:
    """Updates a recurring template."""
    return ScheduledTransactionOut.model_validate(scheduled_service.update_scheduled(db, user, scheduled_id, data))


@router.delete("/{scheduled_id}", status_code=204)
def delete_scheduled(scheduled_id: str, user: CurrentUser, db: DbSession) -> None:
    """Deletes a recurring template."""
    scheduled_service.delete_scheduled(db, user, scheduled_id)


@router.post("/{scheduled_id}/toggle", response_model=ScheduledTransactionOut)
def toggle_scheduled(scheduled_id: str, data: ToggleInput, user: CurrentUser, db: DbSession) -> ScheduledTransactionOut:
    """Pauses or resumes a recurring template."""
    return ScheduledTransactionOut.model_validate(
        scheduled_service.toggle_scheduled(db, user, scheduled_id, data.is_active)
    )
