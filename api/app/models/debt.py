from __future__ import annotations

from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, field_validator


class DebtMetadataRequest(BaseModel):
    apr: Decimal                              # e.g. 24.990
    min_payment_type: Literal["fixed", "percent"]
    min_payment_value: Decimal               # $ if fixed, % if percent (e.g. 1.0 = 1%)
    min_payment_floor: Optional[Decimal] = None
    statement_due_day: Optional[int] = None  # 1-31
    original_principal: Optional[Decimal] = None
    term_months: Optional[int] = None
    opened_date: Optional[str] = None        # ISO date string YYYY-MM-DD

    @field_validator("apr")
    @classmethod
    def apr_positive(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("APR must be non-negative")
        return v

    @field_validator("min_payment_value")
    @classmethod
    def min_payment_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("min_payment_value must be positive")
        return v

    @field_validator("statement_due_day")
    @classmethod
    def due_day_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 31):
            raise ValueError("statement_due_day must be 1-31")
        return v


class DebtMetadataResponse(BaseModel):
    account_id: str
    apr: Decimal
    min_payment_type: str
    min_payment_value: Decimal
    min_payment_floor: Optional[Decimal]
    statement_due_day: Optional[int]
    original_principal: Optional[Decimal]
    term_months: Optional[int]
    opened_date: Optional[str]
    # computed fields from latest balance
    current_balance: Optional[Decimal] = None
    monthly_interest: Optional[Decimal] = None    # balance * (apr/100/12)
    min_payment_computed: Optional[Decimal] = None  # resolved min payment for current balance
