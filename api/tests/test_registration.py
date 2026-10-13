import asyncio

import pytest
from fastapi import HTTPException

from app.config import settings
from app.routers import auth
from app.models.auth import RegisterRequest


class FakeDb:
    def __init__(self, users):
        self.users = users

    async def fetchval(self, sql, *args):
        return self.users if "COUNT" in sql else None


def attempt(users, allow):
    settings.ALLOW_REGISTRATION = allow
    body = RegisterRequest(email="a@example.com", password="x" * 12)
    return asyncio.run(auth.register(body, None, None, FakeDb(users), None))


def test_registration_closed_after_first_user():
    try:
        with pytest.raises(HTTPException) as e:
            attempt(users=1, allow=False)
        assert e.value.status_code == 403
    finally:
        settings.ALLOW_REGISTRATION = False
