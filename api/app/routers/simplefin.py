from __future__ import annotations

from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.auth.crypto import get_master_key
from app.auth.session import get_current_user
from app.database import get_db
from app.dependencies import get_arq_redis
from app.models.simplefin import ConnectRequest, ConnectResponse, StatusResponse
from app.simplefin.client import SimpleFINAuthError, SimpleFINProtocolError
from app.simplefin.service import connect_simplefin

router = APIRouter(tags=["simplefin"])


def _get_master_key(request: Request) -> bytes:
    return request.app.state.master_key


@router.post("/connect", response_model=ConnectResponse, status_code=201)
async def connect(
    body: ConnectRequest,
    request: Request,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> ConnectResponse:
    """
    Claim a SimpleFIN setup URL and store encrypted credentials.

    The setup URL and resulting access URL are never logged or returned.
    """
    master_key = request.app.state.master_key
    user_id = str(user["id"])

    try:
        await connect_simplefin(db, user_id, body.setup_url, master_key)
    except SimpleFINAuthError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "detail": str(exc),
                "hint": (
                    "The setup URL may already be claimed or revoked. "
                    "Check your SimpleFIN account."
                ),
            },
        )
    except SimpleFINProtocolError as exc:
        raise HTTPException(
            status_code=502,
            detail={"detail": str(exc)},
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return ConnectResponse(status="connected")


@router.get("/status", response_model=StatusResponse)
async def status(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> StatusResponse:
    """Return the SimpleFIN connection status for the current user."""
    user_id = str(user["id"])

    row = await db.fetchrow(
        "SELECT status, last_sync_at FROM simplefin_credentials WHERE user_id=$1",
        user_id,
    )
    if row is None:
        return StatusResponse(connected=False, status=None, last_sync_at=None)

    return StatusResponse(
        connected=True,
        status=row["status"],
        last_sync_at=row["last_sync_at"],
    )


@router.delete("/disconnect", status_code=204, response_class=Response)
async def disconnect(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Response:
    """Delete SimpleFIN credentials for the current user."""
    user_id = str(user["id"])
    await db.execute(
        "DELETE FROM simplefin_credentials WHERE user_id=$1",
        user_id,
    )
    return Response(status_code=204)


@router.post("/refresh", status_code=202)
async def trigger_refresh(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
    arq_redis=Depends(get_arq_redis),
) -> dict:
    """
    Enqueue an on-demand sync job for the current user.

    Returns 202 Accepted immediately; the worker picks up the job asynchronously.
    """
    user_id = str(user["id"])

    row = await db.fetchrow(
        "SELECT status FROM simplefin_credentials WHERE user_id=$1",
        user_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="No SimpleFIN credentials connected")
    if row["status"] == "auth_failed":
        raise HTTPException(
            status_code=400,
            detail="SimpleFIN credentials have failed authentication — please reconnect",
        )

    await arq_redis.enqueue_job("sync_user_job", user_id)
    return {"status": "queued"}
