from __future__ import annotations

from fastapi import Response

SESSION_COOKIE = "sovi_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days in seconds


def set_session_cookie(response: Response, token: str, secure: bool = True) -> None:
    """
    Set the sovi_session cookie with HttpOnly; Secure; SameSite=Strict.
    Pass secure=False for local HTTP development (when DEBUG=True).
    """
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="strict",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """Remove the sovi_session cookie."""
    response.delete_cookie(SESSION_COOKIE, path="/")
