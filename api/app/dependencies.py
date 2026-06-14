from __future__ import annotations

from fastapi import Request

# Re-export get_db for convenience so callers can import from one place
from app.database import get_db  # noqa: F401


async def get_redis(request: Request):
    """FastAPI dependency: yields the shared Redis connection pool from app state."""
    return request.app.state.redis


def get_master_key(request: Request) -> bytes:
    """FastAPI dependency: returns the decoded master key from app state."""
    return request.app.state.master_key
