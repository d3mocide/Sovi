from __future__ import annotations

import secrets

from fastapi import HTTPException, Request, Response

CSRF_COOKIE = "sovi_csrf"
CSRF_HEADER = "X-CSRF-Token"

_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


async def verify_csrf(request: Request) -> None:
    """
    FastAPI dependency that enforces the double-submit cookie CSRF pattern.
    Skips validation for safe HTTP methods (GET, HEAD, OPTIONS).
    Raises HTTPException(403) if the cookie and header do not match or are missing.
    """
    if request.method in _SAFE_METHODS:
        return

    cookie_token = request.cookies.get(CSRF_COOKIE)
    header_token = request.headers.get(CSRF_HEADER)

    if not cookie_token or not header_token:
        raise HTTPException(status_code=403, detail="CSRF validation failed")

    if not secrets.compare_digest(cookie_token, header_token):
        raise HTTPException(status_code=403, detail="CSRF validation failed")


def set_csrf_cookie(response: Response, secure: bool = True) -> str:
    """
    Generate a new CSRF token, set it as a non-HttpOnly cookie on the response,
    and return the token value.
    """
    token = secrets.token_hex(32)
    response.set_cookie(
        CSRF_COOKIE,
        token,
        max_age=60 * 60 * 24 * 7,
        httponly=False,   # Must be readable by JS for the double-submit pattern
        secure=secure,
        samesite="strict",
        path="/",
    )
    return token
