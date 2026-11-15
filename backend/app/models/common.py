import uuid
from datetime import UTC, datetime


def new_id() -> str:
    """Generates a UUID4 string used as the primary key of every table."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Current UTC time (timezone-aware) for created_at columns."""
    return datetime.now(UTC)
