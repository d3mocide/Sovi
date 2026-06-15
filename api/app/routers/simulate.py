from fastapi import APIRouter, Depends
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel

from app.auth.session import get_current_user
from app.payoff.engine import simulate as run_simulate
from app.payoff.baseline import interest_saved
from app.payoff.types import Debt as PayoffDebt

router = APIRouter(prefix="/simulate", tags=["simulate"])


class DebtInput(BaseModel):
    id: str
    balance: Decimal
    apr: Decimal
    min_payment_type: Literal["fixed", "percent"]
    min_payment_value: Decimal
    min_payment_floor: Optional[Decimal] = None


class SimulateRequest(BaseModel):
    debts: list[DebtInput]
    extra_monthly: Decimal
    strategy: Literal["avalanche", "snowball", "custom"]
    custom_order: Optional[list[str]] = None


class DebtResultOut(BaseModel):
    id: str
    payoff_month: Optional[int]
    total_interest_paid: Decimal


class SimulateResponse(BaseModel):
    total_months: int
    debt_free_date: Optional[str]  # ISO date string
    total_interest: Decimal
    interest_saved: Decimal
    debt_results: list[DebtResultOut]
    warnings: list[str]
    hit_horizon: bool


@router.post("", response_model=SimulateResponse)
async def simulate_endpoint(
    body: SimulateRequest,
    current_user=Depends(get_current_user),
):
    payoff_debts = [
        PayoffDebt(
            id=d.id,
            balance=d.balance,
            apr=d.apr,
            min_payment_type=d.min_payment_type,
            min_payment_value=d.min_payment_value,
            min_payment_floor=d.min_payment_floor,
        )
        for d in body.debts
    ]

    result = run_simulate(
        payoff_debts, body.extra_monthly, body.strategy,
        custom_order=body.custom_order,
    )
    saved = interest_saved(payoff_debts, body.extra_monthly, body.strategy, body.custom_order)

    return SimulateResponse(
        total_months=result.total_months,
        debt_free_date=result.debt_free_date.isoformat() if result.debt_free_date else None,
        total_interest=result.total_interest,
        interest_saved=saved,
        debt_results=[
            DebtResultOut(
                id=dr.id,
                payoff_month=dr.payoff_month,
                total_interest_paid=dr.total_interest_paid,
            )
            for dr in result.debt_results
        ],
        warnings=result.warnings,
        hit_horizon=result.hit_horizon,
    )
