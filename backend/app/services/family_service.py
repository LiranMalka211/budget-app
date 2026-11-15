from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.errors import ApiError, forbidden, not_found
from app.core.security import new_invite_key
from app.models.family import Family, FamilyMember
from app.models.scheduled import ScheduledTransaction
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.family import FamilyMemberOut, FamilyOut, FamilyOverviewOut


def _membership(db: Session, user_id: str) -> FamilyMember | None:
    """The user's single membership row (pending or approved), if any."""
    return db.scalar(select(FamilyMember).where(FamilyMember.user_id == user_id))


def _family_as_head(db: Session, user: User) -> Family:
    """Returns the family the user heads or raises 403."""
    family = db.get(Family, user.family_id) if user.family_id else None
    if family is None or family.head_user_id != user.id:
        raise forbidden()
    return family


def _move_personal_data_into_family(db: Session, user_id: str, family_id: str) -> None:
    """Attaches the user's personal transactions and schedules to the family they just joined."""
    db.execute(
        update(Transaction)
        .where(Transaction.user_id == user_id, Transaction.family_id.is_(None))
        .values(family_id=family_id)
    )
    db.execute(
        update(ScheduledTransaction)
        .where(ScheduledTransaction.user_id == user_id, ScheduledTransaction.family_id.is_(None))
        .values(family_id=family_id)
    )


def get_overview(db: Session, user: User) -> FamilyOverviewOut | None:
    """Builds the family page payload; pending users see only the family name."""
    link = _membership(db, user.id)
    if link is None:
        return None
    family = db.get(Family, link.family_id)
    if family is None:
        return None
    all_members = db.scalars(select(FamilyMember).where(FamilyMember.family_id == family.id)).all()
    is_pending = link.status == "pending"
    family_out = FamilyOut.model_validate(family)
    if is_pending:
        family_out.invite_key = ""
    to_out = lambda m: FamilyMemberOut.model_validate(m)  # noqa: E731
    return FamilyOverviewOut(
        family=family_out,
        members=[] if is_pending else [to_out(m) for m in all_members if m.status == "approved"],
        pending=[] if is_pending else [to_out(m) for m in all_members if m.status == "pending"],
        is_head=family.head_user_id == user.id,
        my_status=link.status,  # type: ignore[arg-type]
    )


def create_family(db: Session, user: User, name: str) -> Family:
    """Creates a family with the user as approved head and moves their personal data into it."""
    if _membership(db, user.id):
        raise ApiError(409, "already_in_family", "You already belong to a family")
    family = Family(name=name.strip(), invite_key=new_invite_key(), head_user_id=user.id)
    db.add(family)
    db.flush()
    db.add(FamilyMember(user_id=user.id, family_id=family.id, status="approved"))
    user.family_id = family.id
    _move_personal_data_into_family(db, user.id, family.id)
    db.commit()
    db.refresh(family)
    return family


def join_family(db: Session, user: User, invite_key: str) -> str:
    """Creates a pending join request for the family matching the key."""
    if _membership(db, user.id):
        raise ApiError(409, "already_in_family", "You already belong to a family")
    family = db.scalar(select(Family).where(Family.invite_key == invite_key.strip().upper()))
    if family is None:
        raise ApiError(404, "key_not_found", "No family matches this key")
    db.add(FamilyMember(user_id=user.id, family_id=family.id, status="pending"))
    db.commit()
    return "pending"


def approve_member(db: Session, head: User, user_id: str) -> None:
    """Head approves a pending request; the member's personal data joins the family budget."""
    family = _family_as_head(db, head)
    link = db.get(FamilyMember, (user_id, family.id))
    member = db.get(User, user_id)
    if link is None or member is None:
        raise not_found()
    link.status = "approved"
    member.family_id = family.id
    _move_personal_data_into_family(db, member.id, family.id)
    db.commit()


def remove_member(db: Session, head: User, user_id: str) -> None:
    """Head removes an approved member or rejects a pending one. Their transactions stay in the family."""
    family = _family_as_head(db, head)
    if user_id == head.id:
        raise ApiError(409, "head_cannot_leave", "The head cannot remove themselves")
    link = db.get(FamilyMember, (user_id, family.id))
    if link is None:
        raise not_found()
    db.delete(link)
    member = db.get(User, user_id)
    if member and member.family_id == family.id:
        member.family_id = None
    db.commit()


def leave_family(db: Session, user: User) -> None:
    """Leaves (or cancels a pending request). A head may only leave when no other approved members remain."""
    link = _membership(db, user.id)
    if link is None:
        return
    family = db.get(Family, link.family_id)
    others = db.scalars(
        select(FamilyMember).where(
            FamilyMember.family_id == link.family_id,
            FamilyMember.user_id != user.id,
            FamilyMember.status == "approved",
        )
    ).all()
    if family and family.head_user_id == user.id and others:
        raise ApiError(409, "head_cannot_leave", "The head of the family cannot leave while other members remain")
    db.delete(link)
    user.family_id = None
    if family and family.head_user_id == user.id:
        # Last person out: drop the remaining (pending) links and the family itself.
        for pending in db.scalars(select(FamilyMember).where(FamilyMember.family_id == family.id)).all():
            db.delete(pending)
        # Hand the family's history back to whoever created each row (the reverse of joining).
        for model in (Transaction, ScheduledTransaction):
            db.execute(update(model).where(model.family_id == family.id).values(family_id=None))
        db.flush()
        db.delete(family)
    db.commit()


def regenerate_key(db: Session, head: User) -> Family:
    """Replaces the invite key; the old one stops working immediately."""
    family = _family_as_head(db, head)
    family.invite_key = new_invite_key()
    db.commit()
    db.refresh(family)
    return family
