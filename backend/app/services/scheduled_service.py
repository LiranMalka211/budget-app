import calendar
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import not_found
from app.models.scheduled import ScheduledTransaction
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.scheduled import ScheduledTransactionInput
from app.services.scope import visible_scheduled


def _clamp_day(year: int, month: int, day: int) -> date:
    """Builds a date, clamping the day to the month's length (e.g. 31 -> 30 in April)."""
    last = calendar.monthrange(year, month)[1]
    return date(year, month, min(day, last))


def _add_months(d: date, months: int) -> date:
    """Adds whole months to a date, clamping the day."""
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    return _clamp_day(year, month, d.day)


def next_run_after(current: date, interval: str, day_of_month: int | None) -> date:
    """Computes the run date that follows `current` for a schedule."""
    if interval == "weekly":
        return current + timedelta(days=7)
    nxt = _add_months(current, 12 if interval == "yearly" else 1)
    if day_of_month:
        nxt = _clamp_day(nxt.year, nxt.month, day_of_month)
    return nxt


def first_run_date(start: date, interval: str, day_of_month: int | None) -> date:
    """First run of a new schedule: the chosen day of month on/after the start date, or the start date itself."""
    if interval == "weekly" or not day_of_month:
        return start
    candidate = _clamp_day(start.year, start.month, day_of_month)
    return candidate if candidate >= start else _add_months(candidate, 1)


def materialize_due(db: Session, schedules: list[ScheduledTransaction], today: date | None = None) -> int:
    """
    Creates transactions for every active schedule whose next_run_date is on or before today and advances
    next_run_date past today. Called lazily by the read endpoints and by the background job. Returns the count.
    """
    today = today or date.today()
    created = 0
    for s in schedules:
        if not s.is_active:
            continue
        guard = 0
        while s.next_run_date <= today and guard < 200:
            guard += 1
            if s.end_date and s.next_run_date > s.end_date:
                s.is_active = False
                break
            db.add(
                Transaction(
                    date=s.next_run_date,
                    title=s.title,
                    amount=s.amount,
                    user_id=s.user_id,
                    category_id=s.category_id,
                    type_id=s.type_id,
                    family_id=s.family_id,
                    source="scheduled",
                )
            )
            created += 1
            s.next_run_date = next_run_after(s.next_run_date, s.interval, s.day_of_month)
    if created:
        db.commit()
    return created


def materialize_for_user(db: Session, user: User) -> int:
    """Runs materialize_due for the schedules the user can see."""
    return materialize_due(db, list(db.scalars(visible_scheduled(user)).all()))


def materialize_all(db: Session) -> int:
    """Runs materialize_due for every active schedule (background job)."""
    rows = db.scalars(select(ScheduledTransaction).where(ScheduledTransaction.is_active.is_(True))).all()
    return materialize_due(db, list(rows))


def list_scheduled(db: Session, user: User) -> list[ScheduledTransaction]:
    """Lists the user's schedules sorted by next run date, after materialising anything due."""
    materialize_for_user(db, user)
    return list(db.scalars(visible_scheduled(user).order_by(ScheduledTransaction.next_run_date)).all())


def create_scheduled(db: Session, user: User, data: ScheduledTransactionInput) -> ScheduledTransaction:
    """Creates a schedule and immediately generates any occurrences already in the past."""
    day = None if data.interval == "weekly" else data.day_of_month
    s = ScheduledTransaction(
        title=data.title.strip(),
        amount=Decimal(str(data.amount)),
        category_id=data.category_id,
        type_id=data.type_id,
        user_id=user.id,
        family_id=user.family_id,
        interval=data.interval,
        day_of_month=day,
        start_date=data.start_date,
        end_date=data.end_date,
        next_run_date=first_run_date(data.start_date, data.interval, day),
        is_active=True,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    materialize_due(db, [s])
    db.refresh(s)
    return s


def _get_visible(db: Session, user: User, scheduled_id: str) -> ScheduledTransaction:
    """Loads a schedule the user may see or raises 404."""
    s = db.scalar(visible_scheduled(user).where(ScheduledTransaction.id == scheduled_id))
    if s is None:
        raise not_found()
    return s


def update_scheduled(db: Session, user: User, scheduled_id: str, data: ScheduledTransactionInput) -> ScheduledTransaction:
    """Updates a schedule; recomputes the next run when the recurrence itself changed."""
    s = _get_visible(db, user, scheduled_id)
    day = None if data.interval == "weekly" else data.day_of_month
    recurrence_changed = (s.interval, s.day_of_month, s.start_date) != (data.interval, day, data.start_date)
    s.title = data.title.strip()
    s.amount = Decimal(str(data.amount))
    s.category_id = data.category_id
    s.type_id = data.type_id
    s.interval = data.interval
    s.day_of_month = day
    s.start_date = data.start_date
    s.end_date = data.end_date
    if recurrence_changed:
        first = first_run_date(data.start_date, data.interval, day)
        s.next_run_date = first if first > date.today() else s.next_run_date
    db.commit()
    db.refresh(s)
    return s


def delete_scheduled(db: Session, user: User, scheduled_id: str) -> None:
    """Deletes a schedule; transactions it already generated are kept."""
    s = _get_visible(db, user, scheduled_id)
    db.delete(s)
    db.commit()


def toggle_scheduled(db: Session, user: User, scheduled_id: str, is_active: bool) -> ScheduledTransaction:
    """Pauses or resumes a schedule."""
    s = _get_visible(db, user, scheduled_id)
    s.is_active = is_active
    db.commit()
    db.refresh(s)
    return s
