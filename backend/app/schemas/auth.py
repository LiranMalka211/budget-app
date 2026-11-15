from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class UserOut(CamelModel):
    """Public user representation (never includes the password hash)."""

    id: str
    first_name: str
    last_name: str
    email: EmailStr
    family_id: str | None = None


class RegisterInput(CamelModel):
    """Registration payload."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginInput(CamelModel):
    """Login payload."""

    email: EmailStr
    password: str


class AuthResponse(CamelModel):
    """Returned after login/register."""

    token: str
    user: UserOut


class UpdateProfileInput(CamelModel):
    """Editable profile fields."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)


class ForgotPasswordInput(CamelModel):
    """Forgot-password payload."""

    email: EmailStr


class ForgotPasswordResponse(CamelModel):
    """Empty in production; carries the token in development so the flow can be tested without email."""

    reset_token: str | None = None


class ResetPasswordInput(CamelModel):
    """Reset-password payload."""

    token: str
    password: str = Field(min_length=8, max_length=128)
