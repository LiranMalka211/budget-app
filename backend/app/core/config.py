from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and the backend/.env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite:///./budget.db"
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

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS_ORIGINS split into a list of origins."""
        return [v.strip() for v in self.cors_origins.split(",") if v.strip()]

    @property
    def is_development(self) -> bool:
        """True outside production; enables conveniences such as returning reset tokens in responses."""
        return self.app_env.lower() != "production"


@lru_cache
def get_settings() -> Settings:
    """Returns the cached settings instance."""
    return Settings()
