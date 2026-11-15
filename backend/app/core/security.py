import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hashes a plain-text password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Checks a plain-text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    """Issues a signed JWT whose subject is the user id."""
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expires}, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Returns the user id inside a valid token, or None when it is invalid or expired."""
    try:
        payload = jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


def new_invite_key() -> str:
    """Generates a short, human-friendly family invite key such as "K7PQ-3MZD"."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    block = lambda: "".join(secrets.choice(alphabet) for _ in range(4))  # noqa: E731
    return f"{block()}-{block()}"


def new_reset_token() -> str:
    """Generates an unguessable password-reset token."""
    return secrets.token_urlsafe(32)
