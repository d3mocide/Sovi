from __future__ import annotations

import json
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth.session import get_current_user
from app.database import get_db
from app.models.scenarios import ScenarioCreate, ScenarioResponse

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("", response_model=list[ScenarioResponse])
async def list_scenarios(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> list[ScenarioResponse]:
    """List all saved payoff scenarios for the current user, newest first."""
    user_id = str(current_user["id"])

    rows = await db.fetch(
        "SELECT id, name, strategy, extra_monthly, custom_order, created_at FROM scenarios WHERE user_id=$1 ORDER BY created_at DESC",
        user_id,
    )

    return [
        ScenarioResponse(
            id=str(r["id"]),
            name=r["name"],
            strategy=r["strategy"],
            extra_monthly=r["extra_monthly"],
            custom_order=r["custom_order"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


@router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(
    body: ScenarioCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> ScenarioResponse:
    """Save a new payoff scenario (strategy + extra monthly + optional custom order)."""
    user_id = str(current_user["id"])

    custom_order_json = (
        json.dumps(body.custom_order) if body.custom_order is not None else None
    )

    row = await db.fetchrow(
        """
        INSERT INTO scenarios (user_id, name, strategy, extra_monthly, custom_order)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING id, name, strategy, extra_monthly, custom_order, created_at
        """,
        user_id,
        body.name,
        body.strategy,
        body.extra_monthly,
        custom_order_json,
    )

    return ScenarioResponse(
        id=str(row["id"]),
        name=row["name"],
        strategy=row["strategy"],
        extra_monthly=row["extra_monthly"],
        custom_order=row["custom_order"],
        created_at=row["created_at"],
    )


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(
    scenario_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> Response:
    """Delete a saved scenario. 404 if it doesn't belong to the current user."""
    user_id = str(current_user["id"])

    result = await db.execute(
        "DELETE FROM scenarios WHERE id=$1 AND user_id=$2",
        scenario_id,
        user_id,
    )

    # asyncpg returns "DELETE N" — if N=0 the row wasn't found or wasn't owned by user
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Scenario not found")

    return Response(status_code=204)
