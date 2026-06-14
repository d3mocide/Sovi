from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth.session import get_current_user
from app.database import get_db
from app.models.debt import DebtMetadataRequest, DebtMetadataResponse

router = APIRouter(tags=["debt"])


def _compute_fields(
    apr: Decimal,
    min_payment_type: str,
    min_payment_value: Decimal,
    min_payment_floor: Optional[Decimal],
    current_balance: Optional[Decimal],
) -> tuple[Optional[Decimal], Optional[Decimal], Optional[Decimal]]:
    """
    Returns (current_balance, monthly_interest, min_payment_computed).
    All Decimal arithmetic — no floats.
    """
    if current_balance is None:
        return None, None, None

    balance = Decimal(str(current_balance))

    # monthly_interest = balance * (apr / 100 / 12)
    monthly_interest = balance * (apr / Decimal("100") / Decimal("12"))

    # min_payment_computed
    if min_payment_type == "fixed":
        min_payment_computed = min_payment_value
    else:
        # percent: max(floor or 0, balance * min_payment_value / 100)
        percent_amount = balance * (min_payment_value / Decimal("100"))
        floor = min_payment_floor if min_payment_floor is not None else Decimal("0")
        min_payment_computed = max(floor, percent_amount)

    return balance, monthly_interest, min_payment_computed


@router.get("/accounts/{account_id}/debt-metadata", response_model=DebtMetadataResponse)
async def get_debt_metadata(
    account_id: str,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> DebtMetadataResponse:
    """
    Fetch debt metadata for an account.  Verifies user ownership via JOIN on accounts.
    Returns computed fields (monthly_interest, min_payment_computed) from latest balance.
    404 if no debt_metadata row exists or account doesn't belong to user.
    """
    user_id = str(user["id"])

    row = await db.fetchrow(
        """
        SELECT dm.*, bs.balance AS current_balance
        FROM debt_metadata dm
        JOIN accounts a ON a.id = dm.account_id
        LEFT JOIN LATERAL (
            SELECT balance FROM balance_snapshots
            WHERE account_id = dm.account_id
            ORDER BY captured_at DESC LIMIT 1
        ) bs ON TRUE
        WHERE dm.account_id = $1 AND a.user_id = $2
        """,
        account_id,
        user_id,
    )

    if row is None:
        raise HTTPException(status_code=404, detail="Debt metadata not found")

    apr = Decimal(str(row["apr"]))
    min_payment_value = Decimal(str(row["min_payment_value"]))
    min_payment_floor = Decimal(str(row["min_payment_floor"])) if row["min_payment_floor"] is not None else None
    current_balance_raw = row["current_balance"]
    current_balance = Decimal(str(current_balance_raw)) if current_balance_raw is not None else None

    balance, monthly_interest, min_payment_computed = _compute_fields(
        apr=apr,
        min_payment_type=row["min_payment_type"],
        min_payment_value=min_payment_value,
        min_payment_floor=min_payment_floor,
        current_balance=current_balance,
    )

    opened_date = row["opened_date"]
    if opened_date is not None and not isinstance(opened_date, str):
        opened_date = str(opened_date)

    return DebtMetadataResponse(
        account_id=str(row["account_id"]),
        apr=apr,
        min_payment_type=row["min_payment_type"],
        min_payment_value=min_payment_value,
        min_payment_floor=min_payment_floor,
        statement_due_day=row["statement_due_day"],
        original_principal=Decimal(str(row["original_principal"])) if row["original_principal"] is not None else None,
        term_months=row["term_months"],
        opened_date=opened_date,
        current_balance=balance,
        monthly_interest=monthly_interest,
        min_payment_computed=min_payment_computed,
    )


@router.put("/accounts/{account_id}/debt-metadata", response_model=DebtMetadataResponse)
async def upsert_debt_metadata(
    account_id: str,
    body: DebtMetadataRequest,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> DebtMetadataResponse:
    """
    Upsert debt metadata for an account.
    Verifies user ownership (via SELECT on accounts table in the INSERT statement).
    Returns DebtMetadataResponse with computed fields from latest balance snapshot.
    404 if account not found or doesn't belong to user.
    """
    user_id = str(user["id"])

    # Upsert — the INSERT selects from accounts to enforce user ownership.
    # If RETURNING returns nothing, the account doesn't exist or doesn't belong to user.
    result = await db.fetchrow(
        """
        INSERT INTO debt_metadata
          (account_id, user_id, apr, min_payment_type, min_payment_value, min_payment_floor,
           statement_due_day, original_principal, term_months, opened_date)
        SELECT $2, a.user_id, $3, $4, $5, $6, $7, $8, $9, $10::date
        FROM accounts a
        WHERE a.id = $2 AND a.user_id = $1
        ON CONFLICT (account_id) DO UPDATE SET
          apr               = EXCLUDED.apr,
          min_payment_type  = EXCLUDED.min_payment_type,
          min_payment_value = EXCLUDED.min_payment_value,
          min_payment_floor = EXCLUDED.min_payment_floor,
          statement_due_day = EXCLUDED.statement_due_day,
          original_principal= EXCLUDED.original_principal,
          term_months       = EXCLUDED.term_months,
          opened_date       = EXCLUDED.opened_date
        RETURNING account_id
        """,
        user_id,
        account_id,
        body.apr,
        body.min_payment_type,
        body.min_payment_value,
        body.min_payment_floor,
        body.statement_due_day,
        body.original_principal,
        body.term_months,
        body.opened_date,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Account not found or access denied")

    # Fetch latest balance snapshot for computed fields
    snapshot = await db.fetchrow(
        """
        SELECT balance FROM balance_snapshots
        WHERE account_id = $1
        ORDER BY captured_at DESC LIMIT 1
        """,
        account_id,
    )

    current_balance = Decimal(str(snapshot["balance"])) if snapshot is not None else None
    min_payment_floor = body.min_payment_floor

    balance, monthly_interest, min_payment_computed = _compute_fields(
        apr=body.apr,
        min_payment_type=body.min_payment_type,
        min_payment_value=body.min_payment_value,
        min_payment_floor=min_payment_floor,
        current_balance=current_balance,
    )

    return DebtMetadataResponse(
        account_id=account_id,
        apr=body.apr,
        min_payment_type=body.min_payment_type,
        min_payment_value=body.min_payment_value,
        min_payment_floor=min_payment_floor,
        statement_due_day=body.statement_due_day,
        original_principal=body.original_principal,
        term_months=body.term_months,
        opened_date=body.opened_date,
        current_balance=balance,
        monthly_interest=monthly_interest,
        min_payment_computed=min_payment_computed,
    )


@router.delete("/accounts/{account_id}/debt-metadata", status_code=204)
async def delete_debt_metadata(
    account_id: str,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Response:
    """
    Delete debt metadata for an account.  Verifies user ownership.
    Returns 204 on success (row may not have existed — idempotent delete).
    404 if account doesn't belong to user.
    """
    user_id = str(user["id"])

    # Verify account ownership first — fail closed
    account_row = await db.fetchrow(
        "SELECT id FROM accounts WHERE id = $1 AND user_id = $2",
        account_id,
        user_id,
    )
    if account_row is None:
        raise HTTPException(status_code=404, detail="Account not found")

    await db.execute(
        "DELETE FROM debt_metadata WHERE account_id = $1",
        account_id,
    )

    return Response(status_code=204)
