from __future__ import annotations

from datetime import datetime
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from app.auth.session import get_current_user
from app.database import get_db
from app.dependencies import get_arq_redis
from app.sure.client import SureAuthError, SureError
from app.sure.service import connect_sure
from app.sure.store import apply_export

router = APIRouter(tags=["sure"])


class SureConnectRequest(BaseModel):
    base_url: str
    api_key: str


class SureStatus(BaseModel):
    connected: bool
    base_url: str | None = None
    status: str | None = None
    last_sync_at: datetime | None = None
    last_error: str | None = None
    details_synced_at: datetime | None = None
    details_note: str | None = None
    account_count: int | None = None


@router.post("/connect", response_model=SureStatus, status_code=201)
async def connect(
    body: SureConnectRequest,
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
    arq_redis=Depends(get_arq_redis),
) -> SureStatus:
    """Validate the key against Sure, store it encrypted, and queue a first sync."""
    user_id = str(user["id"])
    try:
        count = await connect_sure(db, user_id, body.base_url, body.api_key, request.app.state.master_key)
    except SureAuthError:
        raise HTTPException(status_code=400, detail="Sure rejected that API key")
    except SureError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    await arq_redis.enqueue_job("sure_sync_job", user_id, True)
    return SureStatus(connected=True, base_url=body.base_url.rstrip("/"), status="active", account_count=count)


@router.get("/status", response_model=SureStatus)
async def status(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> SureStatus:
    user_id = str(user["id"])
    row = await db.fetchrow("SELECT base_url, status, last_sync_at, last_error, details_synced_at, details_note FROM sure_credentials WHERE user_id=$1", user_id)
    if row is None:
        return SureStatus(connected=False)
    n = await db.fetchval("SELECT count(*) FROM accounts WHERE user_id=$1 AND source='sure' AND archived=false", user_id)
    return SureStatus(connected=True, base_url=row["base_url"], status=row["status"],
                      last_sync_at=row["last_sync_at"], last_error=row["last_error"],
                      details_synced_at=row["details_synced_at"], details_note=row["details_note"], account_count=n)


@router.post("/refresh", status_code=202)
async def refresh(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
    arq_redis=Depends(get_arq_redis),
) -> dict:
    user_id = str(user["id"])
    row = await db.fetchrow("SELECT status FROM sure_credentials WHERE user_id=$1", user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Sure is not connected")
    await arq_redis.enqueue_job("sure_sync_job", user_id, True)
    return {"status": "queued"}


@router.delete("/disconnect", status_code=204, response_class=Response)
async def disconnect(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Response:
    """Forget the key. Already-synced accounts and transactions are kept."""
    await db.execute("DELETE FROM sure_credentials WHERE user_id=$1", str(user["id"]))
    return Response(status_code=204)


_IMPORT_MAX_BYTES = 64 * 1024 * 1024


@router.post("/details/import")
async def import_details(
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Read APR, minimum payment and limits from a Sure export (zip or all.ndjson) the user uploaded.

    Sure's API leaves these out and serves export files only behind a browser login, so the file comes
    from the user's own download. The body is the raw file. Only the account records are read.
    """
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > _IMPORT_MAX_BYTES:
        raise HTTPException(status_code=413, detail="That file is too large")
    chunks, size = [], 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > _IMPORT_MAX_BYTES:
            raise HTTPException(status_code=413, detail="That file is too large")
        chunks.append(chunk)
    if size == 0:
        raise HTTPException(status_code=422, detail="No file received")
    try:
        return await apply_export(db, str(user["id"]), b"".join(chunks))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
