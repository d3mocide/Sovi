from dataclasses import dataclass, field
from decimal import Decimal
from datetime import date
from typing import Literal, Optional


@dataclass
class Debt:
    id: str
    balance: Decimal
    apr: Decimal                    # e.g. Decimal("22.99")
    min_payment_type: Literal["fixed", "percent"]
    min_payment_value: Decimal
    min_payment_floor: Optional[Decimal] = None


@dataclass
class MonthSnapshot:
    month: int
    balances: dict[str, Decimal]
    interest_accrued: dict[str, Decimal]
    payments: dict[str, Decimal]


@dataclass
class DebtResult:
    id: str
    payoff_month: Optional[int]
    total_interest_paid: Decimal


@dataclass
class SimulateResult:
    total_months: int
    debt_free_date: Optional[date]
    total_interest: Decimal
    debt_results: list[DebtResult]
    schedule: list[MonthSnapshot]
    warnings: list[str]
    hit_horizon: bool
