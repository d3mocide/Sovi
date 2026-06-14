from __future__ import annotations

from typing import List

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

    # CORS — comma-separated list in env, e.g. "http://localhost:3000,https://app.example.com"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Runtime
    DEBUG: bool = False
    LOG_LEVEL: str = "info"

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
