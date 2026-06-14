from __future__ import annotations

import secrets

from app.auth.crypto import decrypt_secret, encrypt_secret


def generate_data_key() -> bytes:
    """Generate a cryptographically random 32-byte data key."""
    return secrets.token_bytes(32)


def wrap_data_key(data_key: bytes, master_key: bytes) -> bytes:
    """Encrypt a data key with the master key using AES-GCM."""
    return encrypt_secret(data_key, master_key)


def unwrap_data_key(wrapped: bytes, master_key: bytes) -> bytes:
    """Decrypt a wrapped data key using the master key."""
    return decrypt_secret(wrapped, master_key)


def encrypt_access_url(url: str, data_key: bytes) -> bytes:
    """Encrypt the access URL with the per-user data key."""
    return encrypt_secret(url.encode(), data_key)


def decrypt_access_url(enc: bytes, data_key: bytes) -> str:
    """Decrypt the access URL using the per-user data key."""
    return decrypt_secret(enc, data_key).decode()
