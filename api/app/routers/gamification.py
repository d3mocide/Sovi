from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends

from app.auth.session import get_current_user
from app.database import get_db
from app.models.gamification import (
    DebtProgress,
    GamificationResponse,
    MilestoneBadge,
    StreakInfo,
    TrendPoint,
)
from app.payoff.baseline import compute_baseline
from app.payoff.engine import simulate
from app.payoff.types import Debt as PayoffDebt

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("", response_model=GamificationResponse)
async def get_gamification(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> GamificationResponse:
    """
    Returns all 7 gamification mechanics in a single response for the dashboard.
    All data is computed server-side from the payoff engine and snapshot history.
    """
    user_id = str(current_user["id"])
    today = date.today()

    # 1. Fetch debt accounts with latest balance + debt_metadata
    debt_rows = await db.fetch(
        """
        SELECT
            a.id, a.name, a.type,
            dm.apr, dm.original_principal,
            dm.min_payment_type, dm.min_payment_value, dm.min_payment_floor,
            bs.balance as current_balance,
            (SELECT MAX(balance) FROM balance_snapshots WHERE account_id = a.id AND user_id = $1) as peak_balance
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
        """,
        user_id,
    )

    # 2. Fetch active scenario (latest saved, or use defaults)
    scenario_row = await db.fetchrow(
        "SELECT strategy, extra_monthly, custom_order FROM scenarios WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
        user_id,
    )
    strategy = scenario_row["strategy"] if scenario_row else "avalanche"
    extra_monthly = (
        Decimal(str(scenario_row["extra_monthly"])) if scenario_row else Decimal("0")
    )
    custom_order = scenario_row["custom_order"] if scenario_row else None

    # Build PayoffDebt list
    payoff_debts: list[PayoffDebt] = []
    for row in debt_rows:
        if row["current_balance"] is not None and row["apr"] is not None:
            payoff_debts.append(
                PayoffDebt(
                    id=str(row["id"]),
                    balance=Decimal(str(row["current_balance"])),
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

    debt_free_date: str | None = None
    days_until: int | None = None
    interest_saved_val = Decimal("0")
    total_interest_plan = Decimal("0")
    total_interest_baseline = Decimal("0")
    payoff_month_map: dict[str, int | None] = {}

    if payoff_debts:
        result = simulate(payoff_debts, extra_monthly, strategy, custom_order=custom_order)
        baseline = compute_baseline(payoff_debts)
        total_interest_plan = result.total_interest
        total_interest_baseline = baseline.total_interest
        interest_saved_val = max(
            Decimal("0"), baseline.total_interest - result.total_interest
        )
        if result.debt_free_date:
            debt_free_date = result.debt_free_date.isoformat()
            days_until = (result.debt_free_date - today).days
        for dr in result.debt_results:
            payoff_month_map[dr.id] = dr.payoff_month

    # 3. Build per-debt progress
    debt_progress: list[DebtProgress] = []
    for row in debt_rows:
        balance = (
            Decimal(str(row["current_balance"]))
            if row["current_balance"] is not None
            else Decimal("0")
        )
        original = (
            Decimal(str(row["original_principal"])) if row["original_principal"] else None
        )
        peak = Decimal(str(row["peak_balance"])) if row["peak_balance"] else None
        denom = original or peak or balance
        progress_pct = float((1 - balance / denom) * 100) if denom and denom > 0 else 0.0
        progress_pct = max(0.0, min(100.0, progress_pct))
        debt_progress.append(
            DebtProgress(
                account_id=str(row["id"]),
                name=row["name"],
                current_balance=balance,
                original_principal=original,
                peak_balance=peak,
                progress_pct=round(progress_pct, 2),
                payoff_month=payoff_month_map.get(str(row["id"])),
                apr=Decimal(str(row["apr"])) if row["apr"] else None,
            )
        )

    # 4. Total debt trend (last 90 days, daily aggregated by day)
    trend_rows = await db.fetch(
        """
        SELECT
            DATE(bs.captured_at) as snap_date,
            SUM(bs.balance) as total_balance
        FROM balance_snapshots bs
        JOIN accounts a ON a.id = bs.account_id
        WHERE bs.user_id = $1
          AND a.type IN ('credit_card', 'loan')
          AND a.archived = false
          AND bs.captured_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE(bs.captured_at)
        ORDER BY snap_date ASC
        """,
        user_id,
    )
    trend = [
        TrendPoint(
            date=str(row["snap_date"]),
            total_balance=Decimal(str(row["total_balance"])),
        )
        for row in trend_rows
    ]
    total_current_debt = sum(
        (p.current_balance for p in debt_progress), Decimal("0")
    )

    # 5. Milestones
    milestone_rows = await db.fetch(
        "SELECT id, type, label, achieved_at, meta FROM milestones WHERE user_id=$1 ORDER BY achieved_at DESC",
        user_id,
    )
    milestones = [
        MilestoneBadge(
            id=str(r["id"]),
            type=r["type"],
            label=r["label"],
            achieved_at=r["achieved_at"],
            meta=r["meta"],
        )
        for r in milestone_rows
    ]

    # 6. Streaks
    streak_rows = await db.fetch(
        "SELECT type, current_count, longest, last_event_at FROM streaks WHERE user_id=$1",
        user_id,
    )
    streaks = [
        StreakInfo(
            type=r["type"],
            current_count=r["current_count"],
            longest=r["longest"],
            last_event_at=r["last_event_at"],
        )
        for r in streak_rows
    ]

    return GamificationResponse(
        debt_free_date=debt_free_date,
        days_until_debt_free=days_until,
        debt_progress=debt_progress,
        trend=trend,
        total_current_debt=total_current_debt,
        interest_saved=interest_saved_val,
        total_interest_with_plan=total_interest_plan,
        total_interest_baseline=total_interest_baseline,
        milestones=milestones,
        milestone_count=len(milestones),
        streaks=streaks,
    )
