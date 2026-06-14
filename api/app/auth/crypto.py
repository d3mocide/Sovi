from __future__ import annotations

import os
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings

_ph = PasswordHasher()

NONCE_SIZE = 12  # bytes for AES-GCM


def hash_password(plain: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def encrypt_secret(data: bytes, master_key: bytes) -> bytes:
    """Encrypt bytes using AES-GCM. Returns nonce + tag + ciphertext."""
    nonce = os.urandom(NONCE_SIZE)
    aesgcm = AESGCM(master_key)
    # AESGCM.encrypt returns ciphertext + tag (tag is appended)
    ciphertext_with_tag = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext_with_tag


def decrypt_secret(data: bytes, master_key: bytes) -> bytes:
    """Decrypt bytes produced by encrypt_secret. Expects nonce + tag + ciphertext."""
    nonce = data[:NONCE_SIZE]
    ciphertext_with_tag = data[NONCE_SIZE:]
    aesgcm = AESGCM(master_key)
    return aesgcm.decrypt(nonce, ciphertext_with_tag, None)


def generate_session_token() -> str:
    """Generate a cryptographically random 32-byte hex session token."""
    return secrets.token_hex(32)


def get_master_key() -> bytes:
    """
    Read MASTER_KEY from settings, decode from hex.
    Expects 64 hex characters (32 bytes). Raises ValueError on invalid input.
    """
    raw = settings.MASTER_KEY
    try:
        key_bytes = bytes.fromhex(raw)
    except ValueError:
        raise ValueError("MASTER_KEY is not valid hexadecimal")
    if len(key_bytes) != 32:
        raise ValueError(
            f"MASTER_KEY must be 32 bytes (64 hex chars), got {len(key_bytes)} bytes"
        )
    return key_bytes
