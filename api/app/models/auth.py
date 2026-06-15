from __future__ import annotations

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class RegisterResponse(BaseModel):
    user_id: str
    email: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    totp_required: bool
    message: str | None = None


class TotpEnrollResponse(BaseModel):
    secret: str
    uri: str


class TotpVerifyRequest(BaseModel):
    code: str


class TotpVerifyResponse(BaseModel):
    verified: bool


class MeResponse(BaseModel):
    user_id: str
    email: str
    display_name: str | None
    totp_enabled: bool
    is_admin: bool
