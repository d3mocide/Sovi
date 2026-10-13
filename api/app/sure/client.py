"""Read-only client for the Sure (we-promise/sure) REST API. GET requests only."""
from __future__ import annotations

from typing import Any, AsyncIterator

import httpx


class SureAuthError(Exception):
    pass


class SureError(Exception):
    pass


class SureClient:
    def __init__(self, base_url: str, api_key: str, *, timeout: float = 30.0, transport: httpx.AsyncBaseTransport | None = None):
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            headers={"X-Api-Key": api_key, "Accept": "application/json"},
            timeout=timeout,
            transport=transport,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> dict:
        try:
            resp = await self._client.get(path, params=params)
        except httpx.HTTPError as exc:
            # Never include the request (it carries the key) in the message.
            raise SureError(f"could not reach Sure: {type(exc).__name__}") from None
        if resp.status_code in (401, 403):
            raise SureAuthError("Sure rejected the API key")
        if resp.status_code >= 400:
            raise SureError(f"Sure returned HTTP {resp.status_code} for {path}")
        return resp.json()

    async def _paged(self, path: str, key: str, params: dict[str, Any] | None = None, per_page: int = 100) -> AsyncIterator[dict]:
        page = 1
        while True:
            data = await self._get(path, {**(params or {}), "per_page": per_page, "page": page})
            for item in data.get(key, []):
                yield item
            total_pages = data.get("pagination", {}).get("total_pages", 1)
            if page >= total_pages:
                return
            page += 1

    def accounts(self) -> AsyncIterator[dict]:
        return self._paged("/api/v1/accounts", "accounts", {"include_disabled": "false"})

    def transactions(self, *, start_date: str | None = None, account_id: str | None = None) -> AsyncIterator[dict]:
        params: dict[str, Any] = {}
        if start_date:
            params["start_date"] = start_date
        if account_id:
            params["account_id"] = account_id
        return self._paged("/api/v1/transactions", "transactions", params)

    def balances(self, *, account_id: str, start_date: str | None = None) -> AsyncIterator[dict]:
        params: dict[str, Any] = {"account_id": account_id}
        if start_date:
            params["start_date"] = start_date
        return self._paged("/api/v1/balances", "balances", params)

    async def ping(self) -> int:
        """Cheap auth check; returns the account count."""
        data = await self._get("/api/v1/accounts", {"per_page": 1})
        return int(data.get("pagination", {}).get("total_count", 0))
