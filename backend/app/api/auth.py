from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordInput,
    ForgotPasswordResponse,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
    UpdateProfileInput,
    UserOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterInput, db: DbSession) -> AuthResponse:
    """Creates an account and logs the user in."""
    token, user = auth_service.register(db, data)
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(data: LoginInput, db: DbSession) -> AuthResponse:
    """Exchanges email + password for a bearer token."""
    token, user = auth_service.login(db, data)
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    """Returns the logged-in user."""
    return UserOut.model_validate(user)


@router.put("/me", response_model=UserOut)
def update_me(data: UpdateProfileInput, user: CurrentUser, db: DbSession) -> UserOut:
    """Updates the logged-in user's name."""
    return UserOut.model_validate(auth_service.update_profile(db, user, data))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(data: ForgotPasswordInput, db: DbSession) -> ForgotPasswordResponse:
    """Sends a reset link; always returns 200 so emails cannot be enumerated."""
    return ForgotPasswordResponse(reset_token=auth_service.forgot_password(db, data.email))


@router.post("/reset-password", status_code=204)
def reset_password(data: ResetPasswordInput, db: DbSession) -> None:
    """Sets a new password using a reset token."""
    auth_service.reset_password(db, data.token, data.password)
