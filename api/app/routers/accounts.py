from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth.session import get_current_user
from app.database import get_db
from app.models.simplefin import AccountResponse, ManualAccountRequest, UpdateAccountRequest

router = APIRouter(tags=["accounts"])


@router.post("/manual", response_model=AccountResponse, status_code=201)
async def create_manual_account(
    body: ManualAccountRequest,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> AccountResponse:
    """
    Create a manual account (no SimpleFIN connection required).

    If initial_balance is provided, a balance snapshot is recorded at creation time.
    """
    user_id = str(user["id"])
    account_id = str(uuid.uuid4())

    await db.execute(
        """
        INSERT INTO accounts (id, user_id, name, type, currency, credit_limit, is_manual, sfin_account_id)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, NULL)
        """,
        account_id,
        user_id,
        body.name,
        body.type,
        body.currency,
        body.credit_limit,
    )

    balance_date: datetime | None = None
    latest_balance = body.initial_balance

    if body.initial_balance is not None:
        balance_date = datetime.now(tz=timezone.utc)
        await db.execute(
            """
            INSERT INTO balance_snapshots (account_id, balance, balance_date)
            VALUES ($1, $2, $3)
            """,
            account_id,
            body.initial_balance,
            balance_date,
        )

    return AccountResponse(
        id=account_id,
        name=body.name,
        type=body.type,
        currency=body.currency,
        is_manual=True,
        credit_limit=body.credit_limit,
        latest_balance=latest_balance,
        balance_date=balance_date,
    )


@router.get("", response_model=list[AccountResponse])
async def list_accounts(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> list[AccountResponse]:
    """
    List all non-archived accounts for the current user,
    including the most recent balance snapshot per account.
    """
    user_id = str(user["id"])

    rows = await db.fetch(
        """
        SELECT
            a.id,
            a.name,
            a.type,
            a.currency,
            a.is_manual,
            a.credit_limit,
            bs.balance   AS latest_balance,
            bs.balance_date
        FROM accounts a
        LEFT JOIN LATERAL (
            SELECT balance, balance_date
            FROM balance_snapshots
            WHERE account_id = a.id
            ORDER BY balance_date DESC
            LIMIT 1
        ) bs ON TRUE
        WHERE a.user_id = $1
          AND (a.archived IS NULL OR a.archived = FALSE)
        ORDER BY a.name
        """,
        user_id,
    )

    return [
        AccountResponse(
            id=str(row["id"]),
            name=row["name"],
            type=row["type"],
            currency=row["currency"],
            is_manual=row["is_manual"],
            credit_limit=row["credit_limit"],
            latest_balance=row["latest_balance"],
            balance_date=row["balance_date"],
        )
        for row in rows
    ]


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    body: UpdateAccountRequest,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> AccountResponse:
    """
    Update account metadata (name, type, credit_limit, archived).
    User ownership is strictly enforced — fail closed.
    """
    user_id = str(user["id"])

    # Fetch the account, enforcing user_id filter
    existing = await db.fetchrow(
        "SELECT id FROM accounts WHERE id=$1 AND user_id=$2",
        account_id,
        user_id,
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Account not found")

    # Build update from provided (non-None) fields only
    updates: dict[str, object] = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.type is not None:
        updates["type"] = body.type
    if body.credit_limit is not None:
        updates["credit_limit"] = body.credit_limit
    if body.archived is not None:
        updates["archived"] = body.archived

    if updates:
        set_clauses = ", ".join(
            f"{col} = ${i + 2}" for i, col in enumerate(updates.keys())
        )
        values = list(updates.values())
        # user_id filter is the last positional param — fail closed
        await db.execute(
            f"UPDATE accounts SET {set_clauses} WHERE id=$1 AND user_id=${len(values) + 2}",
            account_id,
            *values,
            user_id,
        )

    # Re-fetch updated row with latest balance
    result = await db.fetchrow(
        """
        SELECT
            a.id,
            a.name,
            a.type,
            a.currency,
            a.is_manual,
            a.credit_limit,
            bs.balance   AS latest_balance,
            bs.balance_date
        FROM accounts a
        LEFT JOIN LATERAL (
            SELECT balance, balance_date
            FROM balance_snapshots
            WHERE account_id = a.id
            ORDER BY balance_date DESC
            LIMIT 1
        ) bs ON TRUE
        WHERE a.id = $1 AND a.user_id = $2
        """,
        account_id,
        user_id,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Account not found")

    return AccountResponse(
        id=str(result["id"]),
        name=result["name"],
        type=result["type"],
        currency=result["currency"],
        is_manual=result["is_manual"],
        credit_limit=result["credit_limit"],
        latest_balance=result["latest_balance"],
        balance_date=result["balance_date"],
    )
