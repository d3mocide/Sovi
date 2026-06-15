from __future__ import annotations

from typing import Annotated

import asyncpg
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends

from app.config import settings
from app.database import get_db

router = APIRouter(tags=["ops"])


@router.get("/health")
async def health(db: Annotated[asyncpg.Connection, Depends(get_db)]):
    db_status = "ok"
    redis_status = "ok"

    try:
        await db.fetchval("SELECT 1")
    except Exception:
        db_status = "error"

    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        await r.ping()
        await r.aclose()
    except Exception:
        redis_status = "error"

    return {"status": "ok", "db": db_status, "redis": redis_status}
