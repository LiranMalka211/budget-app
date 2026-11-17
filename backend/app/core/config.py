from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _with_scheme(value: str) -> str:
    """"example.onrender.com" -> "https://example.onrender.com"; values that already have a scheme are kept."""
    value = value.strip()
    return value if not value or "://" in value else f"https://{value}"


class Settings(BaseSettings):
    """Application settings loaded from environment variables and the backend/.env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://budget:change-me@localhost:5432/budget"
    secret_key: str = "change-me-to-a-long-random-string"
    access_token_expire_minutes: int = 60 * 24 * 7
    reset_token_expire_minutes: int = 60

    frontend_url: str = "http://localhost:5173"
    # Comma-separated list; see `cors_origin_list`.
    cors_origins: str = "http://localhost:5173"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "budget@example.com"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-5-5"

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, url: str) -> str:
        """
        Hosted Postgres (Neon, Render, Heroku-style) hands out "postgres://" or "postgresql://" URLs, which SQLAlchemy
        would open with psycopg2; this app ships psycopg 3, so point those at it. Query options such as
        sslmode=require are kept.
        """
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url

    @field_validator("frontend_url")
    @classmethod
    def _frontend_url_scheme(cls, url: str) -> str:
        """Accepts a bare host (what a Render blueprint provides) and makes it an https URL."""
        return _with_scheme(url)

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS_ORIGINS split into a list of origins; bare hosts become https origins."""
        return [_with_scheme(v.strip()).rstrip("/") for v in self.cors_origins.split(",") if v.strip()]

    @property
    def is_development(self) -> bool:
        """True outside production; enables conveniences such as returning reset tokens in responses."""
        return self.app_env.lower() != "production"


@lru_cache
def get_settings() -> Settings:
    """Returns the cached settings instance."""
    return Settings()
