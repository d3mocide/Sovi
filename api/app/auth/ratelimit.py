from __future__ import annotations

from fastapi import HTTPException

LOGIN_MAX = 5
LOGIN_WINDOW = 60 * 15  # 15 minutes in seconds


async def check_rate_limit(redis, key: str) -> None:
    """
    Check if the given key has exceeded the rate limit.
    Raises HTTPException(429) if the counter is at or above LOGIN_MAX.
    """
    raw = await redis.get(key)
    if raw is not None and int(raw) >= LOGIN_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Please try again in 15 minutes.",
        )


async def increment_rate_limit(redis, key: str) -> None:
    """
    Increment the rate-limit counter for a key.
    Sets expiry on first hit so the window self-clears.
    """
    count = await redis.incr(key)
    if count == 1:
        # First failed attempt — start the window
        await redis.expire(key, LOGIN_WINDOW)


async def reset_rate_limit(redis, key: str) -> None:
    """Delete the rate-limit counter for a key (called on successful auth)."""
    await redis.delete(key)
