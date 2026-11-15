from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.auth import UserOut
from app.schemas.base import CamelModel


class FamilyOut(CamelModel):
    """A family; `invite_key` is blanked for members who are not yet approved."""

    id: str
    name: str
    invite_key: str
    head_user_id: str
    created_at: datetime


class FamilyMemberOut(CamelModel):
    """A membership row with the user embedded for display."""

    user_id: str
    family_id: str
    status: Literal["pending", "approved"]
    joined_at: datetime
    user: UserOut


class FamilyOverviewOut(CamelModel):
    """Everything the family page needs in one response."""

    family: FamilyOut
    members: list[FamilyMemberOut]
    pending: list[FamilyMemberOut]
    is_head: bool
    my_status: Literal["pending", "approved"]


class CreateFamilyInput(CamelModel):
    """Create-family payload."""

    name: str = Field(min_length=1, max_length=120)


class JoinFamilyInput(CamelModel):
    """Join-family payload."""

    invite_key: str = Field(min_length=1, max_length=20)


class JoinFamilyResponse(CamelModel):
    """Status of the membership after a join request."""

    status: Literal["pending", "approved"]
