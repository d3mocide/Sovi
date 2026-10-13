import asyncio

import httpx
import pytest

from app.sure.client import SureAuthError, SureClient, SureError


def run(coro):
    return asyncio.run(coro)


def make(handler):
    return SureClient("http://sure.test", "KEY123", transport=httpx.MockTransport(handler))


def test_pagination_follows_total_pages_and_sends_key():
    seen = []

    def handler(req: httpx.Request):
        seen.append((req.url.params["page"], req.headers["x-api-key"]))
        page = int(req.url.params["page"])
        return httpx.Response(200, json={"accounts": [{"id": f"a{page}"}], "pagination": {"total_pages": 3}})

    async def go():
        c = make(handler)
        out = [a["id"] async for a in c.accounts()]
        await c.aclose()
        return out

    assert run(go()) == ["a1", "a2", "a3"]
    assert {k for _, k in seen} == {"KEY123"}


def test_auth_error_has_no_key_in_message():
    async def go():
        c = make(lambda r: httpx.Response(401, json={}))
        try:
            await c.ping()
        finally:
            await c.aclose()

    with pytest.raises(SureAuthError) as e:
        run(go())
    assert "KEY123" not in str(e.value)


def test_server_error():
    async def go():
        c = make(lambda r: httpx.Response(500, json={}))
        try:
            await c.ping()
        finally:
            await c.aclose()

    with pytest.raises(SureError):
        run(go())
