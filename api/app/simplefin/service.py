from __future__ import annotations

import asyncpg

from app.simplefin.client import SimpleFINAuthError, claim_access_url
from app.simplefin.crypto import (
    decrypt_access_url,
    encrypt_access_url,
    generate_data_key,
    unwrap_data_key,
    wrap_data_key,
)


async def connect_simplefin(
    db: asyncpg.Connection,
    user_id: str,
    setup_url: str,
    master_key: bytes,
) -> None:
    """
    Claim setup URL, encrypt access URL, store credentials.

    Security: setup_url and access_url must never appear in logs,
    response bodies, or exception messages.
    """
    # 1. Validate setup_url starts with https://
    if not setup_url.startswith("https://"):
        raise ValueError("Setup URL must use HTTPS")

    # 2. Claim the access URL — raises SimpleFINAuthError on 403
    # Do NOT log setup_url or the resulting access_url at any level
    access_url = await claim_access_url(setup_url)

    # 3. Generate per-user data key, wrap with master key
    data_key = generate_data_key()
    wrapped_key = wrap_data_key(data_key, master_key)

    # 4. Encrypt access URL with per-user data key
    access_url_enc = encrypt_access_url(access_url, data_key)

    # Zero out access_url from memory as soon as possible
    del access_url
    del data_key

    # 5. Upsert simplefin_credentials — reconnecting overwrites old credentials
    await db.execute(
        """
        INSERT INTO simplefin_credentials (user_id, access_url_enc, data_key_enc, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (user_id) DO UPDATE
            SET access_url_enc = EXCLUDED.access_url_enc,
                data_key_enc   = EXCLUDED.data_key_enc,
                status         = 'active',
                last_sync_at   = NULL
        """,
        user_id,
        access_url_enc,
        wrapped_key,
    )


async def get_access_url(
    db: asyncpg.Connection,
    user_id: str,
    master_key: bytes,
) -> str:
    """Retrieve and decrypt the stored access URL for a user."""
    row = await db.fetchrow(
        "SELECT access_url_enc, data_key_enc FROM simplefin_credentials WHERE user_id=$1",
        user_id,
    )
    if not row:
        raise ValueError("No SimpleFIN credentials found")
    data_key = unwrap_data_key(bytes(row["data_key_enc"]), master_key)
    return decrypt_access_url(bytes(row["access_url_enc"]), data_key)


async def mark_auth_failed(db: asyncpg.Connection, user_id: str) -> None:
    """Mark the SimpleFIN credentials as auth_failed."""
    await db.execute(
        "UPDATE simplefin_credentials SET status='auth_failed' WHERE user_id=$1",
        user_id,
    )
