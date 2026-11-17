from sqlalchemy.orm import Session

from app.core.errors import forbidden
from app.models.family import Family, FamilyMember
from app.models.user import User


def can_edit(db: Session, user: User) -> bool:
    """
    Whether the user may change or delete rows in their budget. A personal budget and the head of a family always
    may; other members only when the head granted it. Adding rows is open to every member.
    """
    if not user.family_id:
        return True
    family = db.get(Family, user.family_id)
    if family is not None and family.head_user_id == user.id:
        return True
    link = db.get(FamilyMember, (user.id, user.family_id))
    return bool(link and link.status == "approved" and link.can_edit)


def require_edit(db: Session, user: User) -> None:
    """Raises 403 `edit_not_allowed` unless the user may edit."""
    if not can_edit(db, user):
        raise forbidden("edit_not_allowed")
