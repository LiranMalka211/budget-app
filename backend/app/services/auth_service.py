from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.security import (
    create_access_token,
    hash_password,
    new_reset_token,
    verify_password,
)
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.auth import LoginInput, RegisterInput, UpdateProfileInput
from app.services.email_service import send_password_reset_email


def _find_by_email(db: Session, email: str) -> User | None:
    """Case-insensitive email lookup."""
    return db.scalar(select(User).where(User.email == email.lower()))


def register(db: Session, data: RegisterInput) -> tuple[str, User]:
    """Creates a user and returns a session token with it; rejects duplicate emails."""
    if _find_by_email(db, data.email):
        raise ApiError(409, "email_taken", "An account with this email already exists")
    user = User(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return create_access_token(user.id), user


def login(db: Session, data: LoginInput) -> tuple[str, User]:
    """Verifies credentials and returns a session token."""
    user = _find_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise ApiError(401, "invalid_credentials", "Incorrect email or password")
    return create_access_token(user.id), user


def update_profile(db: Session, user: User, data: UpdateProfileInput) -> User:
    """Updates first and last name."""
    user.first_name = data.first_name.strip()
    user.last_name = data.last_name.strip()
    db.commit()
    db.refresh(user)
    return user


def forgot_password(db: Session, email: str) -> str | None:
    """Creates a reset token and emails the link. Returns the token only in development for local testing."""
    settings = get_settings()
    user = _find_by_email(db, email)
    if user is None:
        return None  # Do not reveal whether the email exists.
    token = new_reset_token()
    db.add(
        PasswordResetToken(
            token=token,
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(minutes=settings.reset_token_expire_minutes),
        )
    )
    db.commit()
    send_password_reset_email(user.email, f"{settings.frontend_url.rstrip('/')}/reset-password/{token}")
    return token if settings.is_development else None


def reset_password(db: Session, token: str, password: str) -> None:
    """Sets a new password when the token is valid, unused and not expired, then burns the token."""
    row = db.get(PasswordResetToken, token)
    expires = row.expires_at if row else None
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)  # SQLite drops tzinfo
    if row is None or row.used or expires is None or expires < datetime.now(UTC):
        raise ApiError(400, "invalid_token", "This reset link is invalid or has expired")
    user = db.get(User, row.user_id)
    if user is None:
        raise ApiError(400, "invalid_token", "This reset link is invalid or has expired")
    user.password_hash = hash_password(password)
    row.used = True
    db.commit()
