from decimal import Decimal
from .engine import simulate
from .types import Debt, SimulateResult


def compute_baseline(debts: list[Debt], horizon_months: int = 600) -> SimulateResult:
    return simulate(debts, Decimal("0"), "avalanche", horizon_months=horizon_months)


def interest_saved(
    debts: list[Debt],
    extra_monthly: Decimal,
    strategy,
    custom_order=None,
) -> Decimal:
    baseline = compute_baseline(debts)
    result = simulate(debts, extra_monthly, strategy, custom_order)
    return baseline.total_interest - result.total_interest
