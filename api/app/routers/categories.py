from __future__ import annotations

import uuid
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth.session import get_current_user
from app.database import get_db
from app.models.categories import (
    CategoryCreate,
    CategoryResponse,
    RuleCreate,
    RuleResponse,
)

router = APIRouter(tags=["categories"])


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> list[CategoryResponse]:
    """List all categories for the current user (tree structure via parent_id)."""
    user_id = str(user["id"])
    rows = await db.fetch(
        """
        SELECT id, name, parent_id, icon, color
        FROM categories
        WHERE user_id = $1
        ORDER BY name
        """,
        user_id,
    )
    return [
        CategoryResponse(
            id=str(row["id"]),
            name=row["name"],
            parent_id=str(row["parent_id"]) if row["parent_id"] else None,
            icon=row["icon"],
            color=row["color"],
        )
        for row in rows
    ]


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CategoryCreate,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> CategoryResponse:
    """Create a new category for the current user."""
    user_id = str(user["id"])
    category_id = str(uuid.uuid4())

    # Validate parent_id belongs to user if provided
    if body.parent_id is not None:
        parent = await db.fetchrow(
            "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
            body.parent_id,
            user_id,
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent category not found")

    row = await db.fetchrow(
        """
        INSERT INTO categories (id, user_id, name, parent_id, icon, color)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, parent_id, icon, color
        """,
        category_id,
        user_id,
        body.name,
        body.parent_id,
        body.icon,
        body.color,
    )

    return CategoryResponse(
        id=str(row["id"]),
        name=row["name"],
        parent_id=str(row["parent_id"]) if row["parent_id"] else None,
        icon=row["icon"],
        color=row["color"],
    )


@router.delete("/categories/{category_id}", status_code=204, response_class=Response)
async def delete_category(
    category_id: str,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Response:
    """Delete a category. Returns 409 if any transactions reference it."""
    user_id = str(user["id"])

    existing = await db.fetchrow(
        "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
        category_id,
        user_id,
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check for transactions referencing this category
    txn_count = await db.fetchval(
        "SELECT COUNT(*) FROM transactions WHERE category_id = $1",
        category_id,
    )
    if txn_count and txn_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category: transactions still reference it",
        )

    await db.execute(
        "DELETE FROM categories WHERE id = $1 AND user_id = $2",
        category_id,
        user_id,
    )
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Categorization Rules
# ---------------------------------------------------------------------------


@router.get("/rules", response_model=list[RuleResponse])
async def list_rules(
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> list[RuleResponse]:
    """List all categorization rules for the current user."""
    user_id = str(user["id"])
    rows = await db.fetch(
        """
        SELECT id, match_type, pattern, category_id, priority
        FROM categorization_rules
        WHERE user_id = $1
        ORDER BY priority ASC, created_at ASC
        """,
        user_id,
    )
    return [
        RuleResponse(
            id=str(row["id"]),
            match_type=row["match_type"],
            pattern=row["pattern"],
            category_id=str(row["category_id"]),
            priority=row["priority"],
        )
        for row in rows
    ]


@router.post("/rules", response_model=RuleResponse, status_code=201)
async def create_rule(
    body: RuleCreate,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> RuleResponse:
    """Create a new categorization rule."""
    user_id = str(user["id"])
    rule_id = str(uuid.uuid4())

    # Validate category belongs to user
    cat = await db.fetchrow(
        "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
        body.category_id,
        user_id,
    )
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")

    row = await db.fetchrow(
        """
        INSERT INTO categorization_rules (id, user_id, match_type, pattern, category_id, priority)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, match_type, pattern, category_id, priority
        """,
        rule_id,
        user_id,
        body.match_type,
        body.pattern,
        body.category_id,
        body.priority,
    )

    return RuleResponse(
        id=str(row["id"]),
        match_type=row["match_type"],
        pattern=row["pattern"],
        category_id=str(row["category_id"]),
        priority=row["priority"],
    )


@router.delete("/rules/{rule_id}", status_code=204, response_class=Response)
async def delete_rule(
    rule_id: str,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Response:
    """Delete a categorization rule."""
    user_id = str(user["id"])

    existing = await db.fetchrow(
        "SELECT id FROM categorization_rules WHERE id = $1 AND user_id = $2",
        rule_id,
        user_id,
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    await db.execute(
        "DELETE FROM categorization_rules WHERE id = $1 AND user_id = $2",
        rule_id,
        user_id,
    )
    return Response(status_code=204)
