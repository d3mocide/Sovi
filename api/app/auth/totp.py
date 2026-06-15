from __future__ import annotations

import pyotp


def generate_totp_secret() -> str:
    """Generate a new random TOTP secret in Base32 format."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    """Return a provisioning URI (otpauth://) suitable for QR code generation."""
    return pyotp.TOTP(secret).provisioning_uri(email, issuer_name="Sovi")


def verify_totp_code(secret: str, code: str) -> bool:
    """
    Verify a TOTP code against a secret.
    Allows a window of ±1 interval (30 s) to account for clock skew.
    """
    return pyotp.TOTP(secret).verify(code, valid_window=1)
