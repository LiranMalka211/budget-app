from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.family import (
    CreateFamilyInput,
    FamilyOut,
    FamilyOverviewOut,
    JoinFamilyInput,
    JoinFamilyResponse,
)
from app.services import family_service

router = APIRouter(prefix="/families", tags=["families"])


@router.get("/me", response_model=FamilyOverviewOut | None)
def my_family(user: CurrentUser, db: DbSession) -> FamilyOverviewOut | None:
    """Family overview for the current user, or null when they have none."""
    return family_service.get_overview(db, user)


@router.post("", response_model=FamilyOut, status_code=201)
def create_family(data: CreateFamilyInput, user: CurrentUser, db: DbSession) -> FamilyOut:
    """Creates a family; the caller becomes its head."""
    return FamilyOut.model_validate(family_service.create_family(db, user, data.name))


@router.post("/join", response_model=JoinFamilyResponse)
def join_family(data: JoinFamilyInput, user: CurrentUser, db: DbSession) -> JoinFamilyResponse:
    """Requests to join a family with an invite key."""
    return JoinFamilyResponse(status=family_service.join_family(db, user, data.invite_key))  # type: ignore[arg-type]


@router.post("/members/{user_id}/approve", status_code=204)
def approve_member(user_id: str, user: CurrentUser, db: DbSession) -> None:
    """Head approves a pending member."""
    family_service.approve_member(db, user, user_id)


@router.delete("/members/{user_id}", status_code=204)
def remove_member(user_id: str, user: CurrentUser, db: DbSession) -> None:
    """Head removes a member or rejects a request."""
    family_service.remove_member(db, user, user_id)


@router.post("/leave", status_code=204)
def leave_family(user: CurrentUser, db: DbSession) -> None:
    """Leaves the family (or cancels a pending request)."""
    family_service.leave_family(db, user)


@router.post("/regenerate-key", response_model=FamilyOut)
def regenerate_key(user: CurrentUser, db: DbSession) -> FamilyOut:
    """Head replaces the invite key."""
    return FamilyOut.model_validate(family_service.regenerate_key(db, user))
