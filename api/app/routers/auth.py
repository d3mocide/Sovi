from __future__ import annotations

from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.auth.cookies import clear_session_cookie, set_session_cookie
from app.auth.crypto import (
    decrypt_secret,
    encrypt_secret,
    get_master_key,
    hash_password,
    verify_password,
)
from app.auth.csrf import set_csrf_cookie, verify_csrf
from app.auth.ratelimit import (
    check_rate_limit,
    increment_rate_limit,
    reset_rate_limit,
)
from app.auth.session import (
    create_session,
    delete_session,
    get_current_user,
    get_partial_session,
)
from app.auth.totp import generate_totp_secret, get_totp_uri, verify_totp_code
from app.config import settings
from app.database import get_db
from app.models.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
    TotpEnrollResponse,
    TotpVerifyRequest,
    TotpVerifyResponse,
)

router = APIRouter(tags=["auth"])


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    _csrf: Annotated[None, Depends(verify_csrf)],
) -> RegisterResponse:
    """
    Create a new user account.
    Does NOT auto-login — the user must go through login + TOTP enrollment.
    """
    # Validate password length
    if len(body.password) < 12:
        raise HTTPException(
            status_code=422, detail="Password must be at least 12 characters"
        )

    # Check for existing email (CITEXT handles case-insensitivity)
    try:
        existing = await db.fetchval(
            "SELECT id FROM users WHERE email = $1", body.email
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Registration failed")

    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    pw_hash = hash_password(body.password)

    try:
        user_count = await db.fetchval("SELECT COUNT(*) FROM users")
        is_first_user = (user_count == 0)
        user_id = await db.fetchval(
            """
            INSERT INTO users (email, password_hash, display_name, is_admin)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            body.email,
            pw_hash,
            body.display_name,
            is_first_user,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Registration failed")

    return RegisterResponse(user_id=str(user_id), email=body.email)


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    response: Response,
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    _csrf: Annotated[None, Depends(verify_csrf)],
) -> LoginResponse:
    """
    Authenticate with email + password.
    On success, creates a partial session (totp_verified=False) and sets cookie.
    Client must then complete TOTP verification (or enroll if not yet set up).
    """
    redis = request.app.state.redis
    rate_key = f"login:{body.email}"

    # 1. Rate limit check
    await check_rate_limit(redis, rate_key)

    # 2. Fetch user by email
    try:
        row = await db.fetchrow(
            "SELECT id, password_hash, totp_enabled FROM users WHERE email = $1",
            body.email,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if row is None:
        # Increment rate limit even on missing user to prevent enumeration timing
        await increment_rate_limit(redis, rate_key)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Verify password
    if not verify_password(body.password, row["password_hash"]):
        await increment_rate_limit(redis, rate_key)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 4. Password correct — reset rate limit
    await reset_rate_limit(redis, rate_key)

    user_id = str(row["id"])
    totp_enabled = row["totp_enabled"]

    # 5. Create partial session (totp_verified=False)
    token = await create_session(redis, user_id, totp_verified=False)
    set_session_cookie(response, token, secure=not settings.DEBUG)

    # 6. Set CSRF cookie
    set_csrf_cookie(response, secure=not settings.DEBUG)

    # 7. Return appropriate response
    if totp_enabled:
        return LoginResponse(totp_required=True)
    else:
        return LoginResponse(
            totp_required=False,
            message="Enroll TOTP to continue",
        )


# ---------------------------------------------------------------------------
# TOTP Enrollment
# ---------------------------------------------------------------------------


@router.post("/totp/enroll", response_model=TotpEnrollResponse)
async def totp_enroll(
    request: Request,
    response: Response,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    session: Annotated[dict, Depends(get_partial_session)],
    _csrf: Annotated[None, Depends(verify_csrf)],
) -> TotpEnrollResponse:
    """
    Generate a new TOTP secret and store it encrypted.
    Does NOT activate TOTP — the user must verify a code first.
    Requires a partial (post-password) session.
    """
    user_id = session["user_id"]

    # Ensure user is not already totp_enabled (re-enrollment requires separate flow)
    try:
        row = await db.fetchrow(
            "SELECT totp_enabled, email FROM users WHERE id = $1", user_id
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if row is None:
        raise HTTPException(status_code=401, detail="User not found")

    # Generate secret
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, row["email"])

    # Encrypt and store
    master_key = get_master_key()
    encrypted = encrypt_secret(secret.encode(), master_key)

    try:
        await db.execute(
            "UPDATE users SET totp_secret_enc = $1 WHERE id = $2",
            encrypted,
            user_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Enrollment failed")

    return TotpEnrollResponse(secret=secret, uri=uri)


# ---------------------------------------------------------------------------
# TOTP Verification
# ---------------------------------------------------------------------------


@router.post("/totp/verify", response_model=TotpVerifyResponse)
async def totp_verify(
    body: TotpVerifyRequest,
    request: Request,
    response: Response,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    session: Annotated[dict, Depends(get_partial_session)],
    _csrf: Annotated[None, Depends(verify_csrf)],
) -> TotpVerifyResponse:
    """
    Verify a TOTP code.
    On first-time enrollment, activates TOTP for the account.
    Upgrades session to totp_verified=True.
    """
    redis = request.app.state.redis
    user_id = session["user_id"]
    rate_key = f"totp:{user_id}"

    # Rate limit TOTP attempts
    await check_rate_limit(redis, rate_key)

    # Fetch TOTP secret
    try:
        row = await db.fetchrow(
            "SELECT totp_secret_enc, totp_enabled FROM users WHERE id = $1",
            user_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if row is None or row["totp_secret_enc"] is None:
        raise HTTPException(
            status_code=400, detail="TOTP not set up. Enroll first."
        )

    # Decrypt secret
    master_key = get_master_key()
    try:
        secret = decrypt_secret(bytes(row["totp_secret_enc"]), master_key).decode()
    except Exception:
        raise HTTPException(status_code=401, detail="TOTP verification failed")

    # Verify the code
    if not verify_totp_code(secret, body.code):
        await increment_rate_limit(redis, rate_key)
        raise HTTPException(status_code=401, detail="Invalid TOTP code")

    # Code correct — reset rate limit
    await reset_rate_limit(redis, rate_key)

    # If this is the first successful verification, enable TOTP
    if not row["totp_enabled"]:
        try:
            await db.execute(
                "UPDATE users SET totp_enabled = true WHERE id = $1",
                user_id,
            )
        except Exception:
            raise HTTPException(status_code=401, detail="TOTP activation failed")

    # Upgrade session to totp_verified=True
    # Get the current session token from cookie, delete old, create new upgraded session
    token = request.cookies.get("sovi_session")
    if token:
        await delete_session(redis, token)

    new_token = await create_session(redis, user_id, totp_verified=True)
    set_session_cookie(response, new_token, secure=not settings.DEBUG)

    # Refresh CSRF cookie
    set_csrf_cookie(response, secure=not settings.DEBUG)

    return TotpVerifyResponse(verified=True)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------


@router.post("/logout", status_code=204, response_class=Response)
async def logout(
    request: Request,
    _user: Annotated[dict, Depends(get_current_user)],
    _csrf: Annotated[None, Depends(verify_csrf)],
) -> Response:
    """
    Invalidate the current session and clear cookies.
    Requires a fully authenticated session (totp_verified=True).
    """
    redis = request.app.state.redis

    token = request.cookies.get("sovi_session")
    if token:
        await delete_session(redis, token)

    resp = Response(status_code=204)
    clear_session_cookie(resp)
    resp.delete_cookie("sovi_csrf", path="/")
    return resp


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------


@router.get("/me", response_model=MeResponse)
async def me(
    user: Annotated[dict, Depends(get_current_user)],
) -> MeResponse:
    """Return the current authenticated user's profile."""
    return MeResponse(
        user_id=str(user["id"]),
        email=user["email"],
        display_name=user.get("display_name"),
        totp_enabled=user["totp_enabled"],
        is_admin=user.get("is_admin", False),
    )


@router.get("/setup-status")
async def setup_status(
    response: Response,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    """Check if the system has been initialized (i.e. has at least one user)."""
    set_csrf_cookie(response, secure=not settings.DEBUG)
    count = await db.fetchval("SELECT COUNT(*) FROM users")
    return {"is_initialized": count > 0}


@router.post("/totp/disable", response_model=MeResponse)
async def totp_disable(
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
    _csrf: Annotated[None, Depends(verify_csrf)],
) -> MeResponse:
    """Disable TOTP for the current user."""
    user_id = str(user["id"])
    try:
        await db.execute(
            "UPDATE users SET totp_enabled = false, totp_secret_enc = NULL WHERE id = $1",
            user_id,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to disable TOTP")
    
    return MeResponse(
        user_id=user_id,
        email=user["email"],
        display_name=user.get("display_name"),
        totp_enabled=False,
        is_admin=user.get("is_admin", False),
    )


