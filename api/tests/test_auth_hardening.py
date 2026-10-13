import asyncio

import pyotp
import pytest
from fastapi import HTTPException

from app.auth import session as session_mod
from app.auth.crypto import encrypt_secret, get_master_key
from app.config import settings
from app.models.auth import TotpVerifyRequest
from app.routers import auth
from app.sure.service import normalise_base_url

settings.MASTER_KEY = "00" * 32


class FakeRedis:
    def __init__(self):
        self.data = {}

    async def get(self, k):
        return self.data.get(k)

    async def set(self, k, v, ex=None, nx=False):
        if nx and k in self.data:
            return None
        self.data[k] = v
        return True

    async def expire(self, k, s):
        return True

    async def incr(self, k):
        self.data[k] = int(self.data.get(k, 0)) + 1
        return self.data[k]

    async def delete(self, k):
        self.data.pop(k, None)


class FakeApp:
    def __init__(self, redis):
        self.state = type("S", (), {"redis": redis})()


class FakeRequest:
    def __init__(self, redis, cookies=None):
        self.app = FakeApp(redis)
        self.cookies = cookies or {}


class FakeDb:
    def __init__(self, row):
        self.row = row

    async def fetchrow(self, sql, *args):
        return self.row

    async def execute(self, sql, *args):
        return None


def run(coro):
    return asyncio.run(coro)


def test_enroll_refused_when_totp_already_enabled():
    db = FakeDb({"totp_enabled": True, "email": "a@example.com"})
    with pytest.raises(HTTPException) as e:
        run(auth.totp_enroll(FakeRequest(FakeRedis()), None, db, {"user_id": "u"}, None))
    assert e.value.status_code == 409


def test_disable_needs_a_valid_code():
    secret = pyotp.random_base32()
    db = FakeDb({"totp_secret_enc": encrypt_secret(secret.encode(), get_master_key())})
    user = {"id": "u", "email": "a@example.com"}
    with pytest.raises(HTTPException) as e:
        run(auth.totp_disable(TotpVerifyRequest(code="000000"), FakeRequest(FakeRedis()), db, user, None))
    assert e.value.status_code == 401
    code = pyotp.TOTP(secret).now()
    out = run(auth.totp_disable(TotpVerifyRequest(code=code), FakeRequest(FakeRedis()), db, user, None))
    assert out.totp_enabled is False


def test_totp_code_cannot_be_replayed(monkeypatch):
    secret = pyotp.random_base32()
    db = FakeDb({"totp_secret_enc": encrypt_secret(secret.encode(), get_master_key()), "totp_enabled": True})
    redis = FakeRedis()
    code = pyotp.TOTP(secret).now()
    from fastapi import Response

    run(auth.totp_verify(TotpVerifyRequest(code=code), FakeRequest(redis), Response(), db, {"user_id": "u"}, None))
    with pytest.raises(HTTPException) as e:
        run(auth.totp_verify(TotpVerifyRequest(code=code), FakeRequest(redis), Response(), db, {"user_id": "u"}, None))
    assert e.value.status_code == 401


def test_password_only_session_is_not_enough():
    redis = FakeRedis()
    token = run(session_mod.create_session(redis, "u", totp_verified=False))
    db = FakeDb({"id": "u", "email": "a@example.com", "display_name": None, "totp_enabled": False, "is_admin": True})
    with pytest.raises(HTTPException) as e:
        run(session_mod.get_current_user(FakeRequest(redis, {"sovi_session": token}), db))
    assert e.value.status_code == 401
    token = run(session_mod.create_session(redis, "u", totp_verified=True))
    assert run(session_mod.get_current_user(FakeRequest(redis, {"sovi_session": token}), db))["id"] == "u"


@pytest.mark.parametrize("url", [
    "http://169.254.169.254", "http://0.0.0.0:3000", "http://user:pw@sure.example.com",
    "ftp://sure.example.com", "http://metadata.google.internal",
])
def test_sure_url_rejected(url):
    with pytest.raises(ValueError):
        normalise_base_url(url)


def test_sure_url_accepts_lan_and_https():
    assert normalise_base_url("https://sure.example.com/") == "https://sure.example.com"
    assert normalise_base_url("http://192.0.2.10:3000/x") == "http://192.0.2.10:3000"
