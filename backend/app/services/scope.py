from sqlalchemy import Select, select

from app.models.scheduled import ScheduledTransaction
from app.models.transaction import Transaction
from app.models.user import User


def visible_transactions(user: User) -> Select[tuple[Transaction]]:
    """Base query for the transactions a user may see: the whole family's, or their own personal ones."""
    stmt = select(Transaction)
    if user.family_id:
        return stmt.where(Transaction.family_id == user.family_id)
    return stmt.where(Transaction.user_id == user.id, Transaction.family_id.is_(None))


def visible_scheduled(user: User) -> Select[tuple[ScheduledTransaction]]:
    """Base query for scheduled transactions, scoped the same way as transactions."""
    stmt = select(ScheduledTransaction)
    if user.family_id:
        return stmt.where(ScheduledTransaction.family_id == user.family_id)
    return stmt.where(ScheduledTransaction.user_id == user.id, ScheduledTransaction.family_id.is_(None))
