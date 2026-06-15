from __future__ import annotations

import json
from typing import Annotated

import asyncpg
from fastapi import Depends, HTTPException, Request

from app.auth.crypto import generate_session_token
from app.database import get_db

SESSION_PREFIX = "session:"
SESSION_TTL = 60 * 60 * 24 * 7  # 7 days in seconds


async def create_session(redis, user_id: str, totp_verified: bool = False) -> str:
    """
    Generate a session token, store session data in Redis, and return the token.
    """
    token = generate_session_token()
    key = SESSION_PREFIX + token
    payload = json.dumps({"user_id": user_id, "totp_verified": totp_verified})
    await redis.set(key, payload, ex=SESSION_TTL)
    return token


async def get_session(redis, token: str) -> dict | None:
    """
    Fetch and parse a session from Redis. Slides the TTL on hit. Returns None if missing.
    """
    key = SESSION_PREFIX + token
    raw = await redis.get(key)
    if raw is None:
        return None
    # Slide the TTL (rolling session)
    await redis.expire(key, SESSION_TTL)
    return json.loads(raw)


async def delete_session(redis, token: str) -> None:
    """Delete a session from Redis."""
    key = SESSION_PREFIX + token
    await redis.delete(key)


async def get_current_user(
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> dict:
    """
    FastAPI dependency: validates sovi_session cookie, requires totp_verified=True.
    Returns a dict with {id, email, display_name, totp_enabled}.
    Raises 401 on any failure.
    """
    from app.dependencies import get_redis  # local import to avoid circular

    redis = request.app.state.redis

    token = request.cookies.get("sovi_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await get_session(redis, token)
    if session is None:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    if not session.get("totp_verified"):
        raise HTTPException(status_code=401, detail="TOTP verification required")

    user_id = session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    try:
        row = await db.fetchrow(
            "SELECT id, email, display_name, totp_enabled FROM users WHERE id = $1",
            user_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if row is None:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(row)


async def get_partial_session(
    request: Request,
) -> dict:
    """
    FastAPI dependency: validates sovi_session cookie but does NOT require totp_verified.
    Used during TOTP enrollment/verification step of login.
    Returns session dict {user_id, totp_verified}.
    Raises 401 if session is missing or invalid.
    """
    redis = request.app.state.redis

    token = request.cookies.get("sovi_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await get_session(redis, token)
    if session is None:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    if not session.get("user_id"):
        raise HTTPException(status_code=401, detail="Invalid session")

    return session
