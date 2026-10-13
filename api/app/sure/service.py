from __future__ import annotations

from urllib.parse import urlparse

import asyncpg

from app.simplefin.crypto import (
    decrypt_access_url as decrypt_text,
    encrypt_access_url as encrypt_text,
    generate_data_key,
    unwrap_data_key,
    wrap_data_key,
)
from app.sure.client import SureClient


def normalise_base_url(url: str) -> str:
    u = url.strip().rstrip("/")
    p = urlparse(u)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise ValueError("Sure URL must start with http:// or https://")
    return f"{p.scheme}://{p.netloc}"


async def connect_sure(db: asyncpg.Connection, user_id: str, base_url: str, api_key: str, master_key: bytes) -> int:
    """Validate the key against Sure, then store it encrypted. Returns the account count Sure reports.

    The API key never appears in logs, responses or exception messages.
    """
    base_url = normalise_base_url(base_url)
    client = SureClient(base_url, api_key)
    try:
        count = await client.ping()
    finally:
        await client.aclose()
    data_key = generate_data_key()
    await db.execute(
        """
        INSERT INTO sure_credentials (user_id, base_url, api_key_enc, data_key_enc, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (user_id) DO UPDATE
            SET base_url = EXCLUDED.base_url, api_key_enc = EXCLUDED.api_key_enc,
                data_key_enc = EXCLUDED.data_key_enc, status = 'active', last_error = NULL, last_sync_at = NULL
        """,
        user_id, base_url, encrypt_text(api_key, data_key), wrap_data_key(data_key, master_key),
    )
    del data_key
    return count


async def get_credentials(db: asyncpg.Connection, user_id: str, master_key: bytes) -> tuple[str, str]:
    row = await db.fetchrow("SELECT base_url, api_key_enc, data_key_enc FROM sure_credentials WHERE user_id=$1", user_id)
    if not row:
        raise ValueError("No Sure connection for this user")
    data_key = unwrap_data_key(bytes(row["data_key_enc"]), master_key)
    return row["base_url"], decrypt_text(bytes(row["api_key_enc"]), data_key)
