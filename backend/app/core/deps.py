from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import ApiError
from app.core.security import decode_access_token
from app.models.user import User

bearer = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    """Resolves the logged-in user from the bearer token or raises 401."""
    if credentials is None:
        raise ApiError(401, "unauthorized", "Missing token")
    user_id = decode_access_token(credentials.credentials)
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise ApiError(401, "unauthorized", "Invalid or expired token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
