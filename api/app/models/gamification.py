from __future__ import annotations

from decimal import Decimal
from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel


class DebtProgress(BaseModel):
    account_id: str
    name: str
    current_balance: Decimal
    original_principal: Optional[Decimal]   # from debt_metadata
    peak_balance: Optional[Decimal]         # max balance ever seen in snapshots
    progress_pct: float                     # 0.0-100.0
    payoff_month: Optional[int]             # from engine
    apr: Optional[Decimal]


class TrendPoint(BaseModel):
    date: str       # ISO date "YYYY-MM-DD"
    total_balance: Decimal


class MilestoneBadge(BaseModel):
    id: str
    type: str
    label: str
    achieved_at: datetime
    meta: Optional[dict]


class StreakInfo(BaseModel):
    type: str
    current_count: int
    longest: int
    last_event_at: Optional[datetime]


class GamificationResponse(BaseModel):
    # Mechanic 1: Debt-free countdown
    debt_free_date: Optional[str]       # ISO date or None
    days_until_debt_free: Optional[int]

    # Mechanic 2: Per-debt progress
    debt_progress: list[DebtProgress]

    # Mechanic 3: Total-debt trend (last 90 days, daily)
    trend: list[TrendPoint]
    total_current_debt: Decimal

    # Mechanic 4: Interest saved
    interest_saved: Decimal
    total_interest_with_plan: Decimal
    total_interest_baseline: Decimal

    # Mechanic 5: Milestones
    milestones: list[MilestoneBadge]
    milestone_count: int

    # Mechanic 6: Streaks
    streaks: list[StreakInfo]

    # Mechanic 7: simulator lives at POST /simulate (already built)
    simulator_hint: str = "Use POST /simulate for interactive projections"
