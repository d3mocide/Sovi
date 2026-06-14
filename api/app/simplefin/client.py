from __future__ import annotations

import httpx


class SimpleFINAuthError(Exception):
    pass


class SimpleFINProtocolError(Exception):
    pass


async def claim_access_url(setup_url: str) -> str:
    """POST to the setup URL (empty body) to exchange for permanent access URL."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(setup_url, content=b"")
        if resp.status_code == 403:
            raise SimpleFINAuthError(
                "Setup URL returned 403 — token may be compromised or already claimed"
            )
        resp.raise_for_status()
        access_url = resp.text.strip()
        if not access_url.startswith("https://"):
            raise SimpleFINProtocolError(
                f"Unexpected access URL format: {access_url[:50]}"
            )
        return access_url


async def fetch_accounts(access_url: str, start_date: int | None = None) -> dict:
    """GET /accounts from the SimpleFIN bridge. Returns raw JSON dict."""
    url = f"{access_url}/accounts"
    params: dict[str, str] = {}
    if start_date:
        params["start-date"] = str(start_date)
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code == 403:
            raise SimpleFINAuthError(
                "Access URL returned 403 — credentials may be invalid or revoked"
            )
        resp.raise_for_status()
        return resp.json()
