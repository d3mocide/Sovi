from __future__ import annotations

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database — can be supplied directly or assembled from parts
    DATABASE_URL: str = ""
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "sovi"
    DB_USER: str = "sovi"
    DB_PASSWORD: str = "changeme"

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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str, info) -> str:
        if v:
            return v
        data = info.data
        host = data.get("DB_HOST", "postgres")
        port = data.get("DB_PORT", 5432)
        name = data.get("DB_NAME", "sovi")
        user = data.get("DB_USER", "sovi")
        password = data.get("DB_PASSWORD", "changeme")
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
