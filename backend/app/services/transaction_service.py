from datetime import date
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import not_found
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionInput
from app.services.scheduled_service import materialize_for_user
from app.services.scope import visible_transactions


def list_transactions(
    db: Session,
    user: User,
    *,
    date_from: date | None,
    date_to: date | None,
    type_id: str | None,
    category_id: str | None,
    search: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Transaction], int]:
    """Filters, sorts (newest first) and pages the user's visible transactions. Returns (items, total)."""
    materialize_for_user(db, user)
    stmt = visible_transactions(user)
    if date_from:
        stmt = stmt.where(Transaction.date >= date_from)
    if date_to:
        stmt = stmt.where(Transaction.date <= date_to)
    if type_id:
        stmt = stmt.where(Transaction.type_id == type_id)
    if category_id:
        stmt = stmt.where(Transaction.category_id == category_id)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(or_(Transaction.title.ilike(pattern), Transaction.note.ilike(pattern)))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return list(rows), int(total)


def create_transaction(db: Session, user: User, data: TransactionInput) -> Transaction:
    """Creates a manual transaction in the user's current scope (family or personal)."""
    tx = Transaction(
        date=data.date,
        title=data.title.strip(),
        amount=Decimal(str(data.amount)),
        user_id=user.id,
        category_id=data.category_id,
        type_id=data.type_id,
        family_id=user.family_id,
        source="manual",
        note=(data.note or "").strip() or None,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def _get_visible(db: Session, user: User, tx_id: str) -> Transaction:
    """Loads a transaction the user may see or raises 404."""
    tx = db.scalar(visible_transactions(user).where(Transaction.id == tx_id))
    if tx is None:
        raise not_found()
    return tx


def update_transaction(db: Session, user: User, tx_id: str, data: TransactionInput) -> Transaction:
    """Updates an existing transaction."""
    tx = _get_visible(db, user, tx_id)
    tx.date = data.date
    tx.title = data.title.strip()
    tx.amount = Decimal(str(data.amount))
    tx.category_id = data.category_id
    tx.type_id = data.type_id
    tx.note = (data.note or "").strip() or None
    db.commit()
    db.refresh(tx)
    return tx


def delete_transaction(db: Session, user: User, tx_id: str) -> None:
    """Deletes a transaction."""
    tx = _get_visible(db, user, tx_id)
    db.delete(tx)
    db.commit()
