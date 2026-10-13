from __future__ import annotations

import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "sovi"
    DB_USER: str = "sovi"
    DB_PASSWORD: str = "changeme"
    REDIS_URL: str = "redis://redis:6379/0"
    MASTER_KEY: str = "changeme"
    LOG_LEVEL: str = "info"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def load_secrets_from_files(cls, data: dict) -> dict:
        # A configured secret file that cannot be read is an error, never a silent fallback to defaults.
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


settings = Settings()
