from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Annotated, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth.session import get_current_user
from app.database import get_db

router = APIRouter(tags=["transactions"])


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class CategoryOverrideRequest(BaseModel):
    category_id: str


class CategoryOverrideResponse(BaseModel):
    transaction_id: str
    category_id: str
    category_source: str
    rule_created: bool


class TransactionItem(BaseModel):
    id: str
    account_id: str
    sfin_txn_id: str
    posted: Optional[str]
    amount: Decimal
    description: str
    pending: bool
    category_id: Optional[str]
    category_source: Optional[str]


class TransactionListResponse(BaseModel):
    items: list[TransactionItem]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.put("/{transaction_id}/category", response_model=CategoryOverrideResponse)
async def override_category(
    transaction_id: str,
    body: CategoryOverrideRequest,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> CategoryOverrideResponse:
    """
    Manual category override for a transaction.

    1. Verifies transaction belongs to user.
    2. Updates category_id and sets category_source='manual'.
    3. Auto-creates a merchant-match rule from the first 20 chars of description.
    Returns {transaction_id, category_id, category_source, rule_created}.
    """
    user_id = str(user["id"])

    # 1. Fetch transaction (verify ownership)
    txn = await db.fetchrow(
        "SELECT id, description FROM transactions WHERE id = $1 AND user_id = $2",
        transaction_id,
        user_id,
    )
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Verify the category exists and belongs to user
    cat = await db.fetchrow(
        "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
        body.category_id,
        user_id,
    )
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")

    description: str = txn["description"] or ""

    # 2. Update transaction
    await db.execute(
        "UPDATE transactions SET category_id = $1, category_source = 'manual' WHERE id = $2 AND user_id = $3",
        body.category_id,
        transaction_id,
        user_id,
    )

    # 3. Auto-create merchant rule
    merchant = description.strip()[:20].rstrip()
    rule_created = False

    if merchant:
        rule_id = str(uuid.uuid4())
        result = await db.execute(
            """
            INSERT INTO categorization_rules
                (id, user_id, match_type, pattern, category_id, priority)
            VALUES ($1, $2, 'merchant', $3, $4, 10)
            ON CONFLICT DO NOTHING
            """,
            rule_id,
            user_id,
            merchant,
            body.category_id,
        )
        # asyncpg execute returns "INSERT 0 N" — check if row was inserted
        try:
            inserted = int(result.split()[-1])
            rule_created = inserted > 0
        except (IndexError, ValueError):
            rule_created = False

    return CategoryOverrideResponse(
        transaction_id=transaction_id,
        category_id=body.category_id,
        category_source="manual",
        rule_created=rule_created,
    )


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
    account_id: Optional[str] = Query(default=None),
    category_id: Optional[str] = Query(default=None),
    start: Optional[date] = Query(default=None),
    end: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
) -> TransactionListResponse:
    """
    List transactions with pagination and optional filters.

    Query params: account_id, category_id, start (ISO date), end (ISO date),
    page (default 1), per_page (default 50, max 200).
    """
    user_id = str(user["id"])
    offset = (page - 1) * per_page

    # Build dynamic WHERE clauses
    conditions = ["t.user_id = $1"]
    params: list = [user_id]
    idx = 2

    if account_id is not None:
        conditions.append(f"t.account_id = ${idx}")
        params.append(account_id)
        idx += 1

    if category_id is not None:
        conditions.append(f"t.category_id = ${idx}")
        params.append(category_id)
        idx += 1

    if start is not None:
        conditions.append(f"t.posted >= ${idx}")
        params.append(start)
        idx += 1

    if end is not None:
        conditions.append(f"t.posted <= ${idx}")
        params.append(end)
        idx += 1

    where_clause = " AND ".join(conditions)

    # Count total
    total = await db.fetchval(
        f"SELECT COUNT(*) FROM transactions t WHERE {where_clause}",
        *params,
    )

    # Fetch page
    rows = await db.fetch(
        f"""
        SELECT
            t.id,
            t.account_id,
            t.sfin_txn_id,
            t.posted,
            t.amount,
            t.description,
            t.pending,
            t.category_id,
            t.category_source
        FROM transactions t
        WHERE {where_clause}
        ORDER BY t.posted DESC NULLS LAST, t.id
        LIMIT ${idx} OFFSET ${idx + 1}
        """,
        *params,
        per_page,
        offset,
    )

    items = [
        TransactionItem(
            id=str(row["id"]),
            account_id=str(row["account_id"]),
            sfin_txn_id=row["sfin_txn_id"],
            posted=row["posted"].isoformat() if row["posted"] else None,
            amount=row["amount"],
            description=row["description"] or "",
            pending=bool(row["pending"]),
            category_id=str(row["category_id"]) if row["category_id"] else None,
            category_source=row["category_source"],
        )
        for row in rows
    ]

    return TransactionListResponse(
        items=items,
        total=total or 0,
        page=page,
        per_page=per_page,
    )
