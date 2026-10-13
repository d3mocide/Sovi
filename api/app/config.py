from __future__ import annotations

from typing import List, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database parts — assembled into DATABASE_URL by model_validator below
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "sovi"
    DB_USER: str = "sovi"
    DB_PASSWORD: str = "changeme"

    # DATABASE_URL can be set directly; if empty it is built from the DB_* parts above
    DATABASE_URL: str = ""

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Security
    SECRET_KEY: str = "changeme"
    MASTER_KEY: str = "changeme"

    # The first account can always be created; after that sign-ups stay closed unless this is true
    ALLOW_REGISTRATION: bool = False

    # CORS — comma-separated list in env, e.g. "http://localhost:3000,https://app.example.com"
    # Use Union[str, List[str]] so pydantic-settings passes raw string to field_validator
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]

    # Read APR/limits through a Sure family export. Off: Sure serves the export file behind a browser login
    # (API keys are redirected to its sign-in page), so the download cannot work with an API key today,
    # and every attempt leaves another export in Sure.
    SURE_EXPORT_SYNC: bool = False

    # LiteLLM
    LITELLM_URL: str = "http://litellm:4000"
    LITELLM_KEY: str = "changeme"

    # Runtime
    DEBUG: bool = False
    # Cookies are Secure (HTTPS only) unless this is turned off for plain-HTTP development.
    COOKIE_SECURE: bool = True
    LOG_LEVEL: str = "info"

    @model_validator(mode="before")
    @classmethod
    def load_secrets_from_files(cls, data: dict) -> dict:
        import os
        # Secrets from files (Docker/Podman secrets). A configured file that cannot be read is an
        # error: falling back to the "changeme" defaults would silently use a known password/key.
        for var in ("DB_PASSWORD", "MASTER_KEY"):
            path = os.environ.get(f"{var}_FILE") or data.get(f"{var}_FILE")
            if path:
                try:
                    with open(path, "r") as f:
                        data[var] = f.read().strip()
                except OSError as exc:
                    raise RuntimeError(f"cannot read {var}_FILE ({path}): {exc.strerror}") from None
        return data

    @model_validator(mode="after")
    def assemble_db_url(self) -> "Settings":
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        return self

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
