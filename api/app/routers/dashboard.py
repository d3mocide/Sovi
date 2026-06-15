from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Optional

import asyncpg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.session import get_current_user
from app.database import get_db
from app.payoff.baseline import compute_baseline
from app.payoff.engine import simulate
from app.payoff.types import Debt as PayoffDebt

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class NextFocusDebt(BaseModel):
    account_id: str
    name: str
    balance: Decimal
    apr: Decimal


class DashboardResponse(BaseModel):
    total_debt: Decimal
    debt_free_date: Optional[str]
    days_until_debt_free: Optional[int]
    next_focus_debt: Optional[NextFocusDebt]
    on_time_streak: int
    interest_saved: Decimal
    accounts_count: int
    unclassified_count: int


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> DashboardResponse:
    """
    Lightweight glanceable summary for the main dashboard screen.
    Returns key metrics without heavy trend data or full milestone lists.
    """
    user_id = str(current_user["id"])

    # Fetch all non-archived accounts for counts
    all_accounts = await db.fetch(
        """
        SELECT a.id, a.type, a.sfin_account_id
        FROM accounts a
        WHERE a.user_id = $1 AND a.archived = false
        """,
        user_id,
    )
    accounts_count = len(all_accounts)
    unclassified_count = sum(
        1
        for r in all_accounts
        if r["type"] == "other" and r["sfin_account_id"] is not None
    )

    # Fetch debt accounts with latest balance + debt_metadata
    debt_rows = await db.fetch(
        """
        SELECT
            a.id, a.name,
            dm.apr,
            dm.min_payment_type, dm.min_payment_value, dm.min_payment_floor,
            bs.balance as current_balance
        FROM accounts a
        LEFT JOIN debt_metadata dm ON dm.account_id = a.id
        LEFT JOIN LATERAL (
            SELECT balance FROM balance_snapshots
            WHERE account_id = a.id
            ORDER BY captured_at DESC LIMIT 1
        ) bs ON true
        WHERE a.user_id = $1
          AND a.type IN ('credit_card', 'loan')
          AND a.archived = false
          AND dm.apr IS NOT NULL
        ORDER BY dm.apr DESC
        """,
        user_id,
    )

    total_debt = Decimal("0")
    payoff_debts: list[PayoffDebt] = []
    next_focus: Optional[NextFocusDebt] = None

    for row in debt_rows:
        balance = (
            Decimal(str(row["current_balance"]))
            if row["current_balance"] is not None
            else Decimal("0")
        )
        total_debt += balance

        if row["current_balance"] is not None and row["apr"] is not None:
            payoff_debts.append(
                PayoffDebt(
                    id=str(row["id"]),
                    balance=balance,
                    apr=Decimal(str(row["apr"])),
                    min_payment_type=row["min_payment_type"],
                    min_payment_value=Decimal(str(row["min_payment_value"])),
                    min_payment_floor=(
                        Decimal(str(row["min_payment_floor"]))
                        if row["min_payment_floor"]
                        else None
                    ),
                )
            )

    # Highest APR debt with positive balance is the next focus (avalanche target)
    for row in debt_rows:
        balance = (
            Decimal(str(row["current_balance"]))
            if row["current_balance"] is not None
            else Decimal("0")
        )
        if balance > 0 and row["apr"] is not None:
            next_focus = NextFocusDebt(
                account_id=str(row["id"]),
                name=row["name"],
                balance=balance,
                apr=Decimal(str(row["apr"])),
            )
            break  # rows already sorted by apr DESC

    # Fetch active scenario for payoff engine
    scenario_row = await db.fetchrow(
        "SELECT strategy, extra_monthly, custom_order FROM scenarios WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
        user_id,
    )
    strategy = scenario_row["strategy"] if scenario_row else "avalanche"
    extra_monthly = (
        Decimal(str(scenario_row["extra_monthly"])) if scenario_row else Decimal("0")
    )
    custom_order = scenario_row["custom_order"] if scenario_row else None

    debt_free_date: Optional[str] = None
    days_until: Optional[int] = None
    interest_saved_val = Decimal("0")

    from datetime import date

    today = date.today()

    if payoff_debts:
        result = simulate(payoff_debts, extra_monthly, strategy, custom_order=custom_order)
        baseline = compute_baseline(payoff_debts)
        interest_saved_val = max(
            Decimal("0"), baseline.total_interest - result.total_interest
        )
        if result.debt_free_date:
            debt_free_date = result.debt_free_date.isoformat()
            days_until = (result.debt_free_date - today).days

    # Fetch on_time streak
    streak_row = await db.fetchrow(
        "SELECT current_count FROM streaks WHERE user_id=$1 AND type='on_time'",
        user_id,
    )
    on_time_streak = streak_row["current_count"] if streak_row else 0

    return DashboardResponse(
        total_debt=total_debt,
        debt_free_date=debt_free_date,
        days_until_debt_free=days_until,
        next_focus_debt=next_focus,
        on_time_streak=on_time_streak,
        interest_saved=interest_saved_val,
        accounts_count=accounts_count,
        unclassified_count=unclassified_count,
    )
