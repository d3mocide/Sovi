from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from dateutil.relativedelta import relativedelta
from copy import deepcopy
from typing import Literal, Optional
from .types import Debt, MonthSnapshot, DebtResult, SimulateResult

EPSILON = Decimal("0.001")
CENTS = Decimal("0.01")


def resolve_min_payment(debt: Debt, balance: Decimal) -> Decimal:
    if debt.min_payment_type == "fixed":
        return min(debt.min_payment_value, balance)
    pct = balance * (debt.min_payment_value / Decimal("100"))
    floor = debt.min_payment_floor or Decimal("0")
    return min(max(pct, floor), balance)


def simulate(
    debts: list[Debt],
    extra_monthly: Decimal,
    strategy: Literal["avalanche", "snowball", "custom"],
    custom_order: Optional[list[str]] = None,
    horizon_months: int = 600,
) -> SimulateResult:
    # deep copy so we don't mutate inputs
    working = [deepcopy(d) for d in debts]
    balances = {d.id: d.balance for d in working}
    debt_map = {d.id: d for d in working}

    total_interest = Decimal("0")
    schedule = []
    debt_results: dict[str, DebtResult] = {d.id: DebtResult(d.id, None, Decimal("0")) for d in working}
    warnings = []
    hit_horizon = False
    month = 0

    # Negative amortization check upfront for baseline detection
    for d in working:
        monthly_rate = d.apr / Decimal("100") / Decimal("12")
        monthly_interest = d.balance * monthly_rate
        min_pmt = resolve_min_payment(d, d.balance)
        if extra_monthly == 0 and min_pmt <= monthly_interest:
            warnings.append(
                f"Debt '{d.id}': minimum payment (${min_pmt:.2f}) does not exceed monthly interest "
                f"(${monthly_interest:.2f}) — will never amortize"
            )

    while any(balances[d.id] > EPSILON for d in working) and month < horizon_months:
        month += 1
        month_interest: dict[str, Decimal] = {}
        month_payments: dict[str, Decimal] = {}

        # Step 1: accrue interest on active debts
        for d in working:
            if balances[d.id] <= EPSILON:
                continue
            monthly_rate = d.apr / Decimal("100") / Decimal("12")
            interest = (balances[d.id] * monthly_rate).quantize(CENTS, rounding=ROUND_HALF_UP)
            balances[d.id] += interest
            total_interest += interest
            month_interest[d.id] = interest

        # Step 2: pay minimums; freed minimums roll into pool
        pool = extra_monthly
        for d in working:
            if balances[d.id] <= EPSILON:
                month_payments[d.id] = month_payments.get(d.id, Decimal("0"))
                continue
            min_due = resolve_min_payment(d, balances[d.id])
            pay = min(min_due, balances[d.id])
            balances[d.id] = max(Decimal("0"), balances[d.id] - pay)
            pool += (min_due - pay)
            month_payments[d.id] = pay

        # Step 3: apply pool in strategy order
        active = [d for d in working if balances[d.id] > EPSILON]
        if strategy == "avalanche":
            active.sort(key=lambda d: d.apr, reverse=True)
        elif strategy == "snowball":
            active.sort(key=lambda d: balances[d.id])
        elif strategy == "custom" and custom_order:
            order_map = {id: i for i, id in enumerate(custom_order)}
            active.sort(key=lambda d: order_map.get(d.id, 9999))

        for d in active:
            if pool <= EPSILON:
                break
            pay = min(pool, balances[d.id])
            pay = pay.quantize(CENTS, rounding=ROUND_HALF_UP)
            balances[d.id] = max(Decimal("0"), balances[d.id] - pay)
            pool -= pay
            month_payments[d.id] = month_payments.get(d.id, Decimal("0")) + pay

        # Step 4: record payoffs
        for d in working:
            if balances[d.id] <= EPSILON and debt_results[d.id].payoff_month is None:
                debt_results[d.id].payoff_month = month
                balances[d.id] = Decimal("0")

        # Record snapshot (round all balances to cents)
        snap_balances = {d.id: balances[d.id].quantize(CENTS, rounding=ROUND_HALF_UP) for d in working}
        schedule.append(MonthSnapshot(
            month=month,
            balances=snap_balances,
            interest_accrued={d.id: month_interest.get(d.id, Decimal("0")) for d in working},
            payments={d.id: month_payments.get(d.id, Decimal("0")) for d in working},
        ))

    if any(balances[d.id] > EPSILON for d in working):
        hit_horizon = True

    # Compute debt_free_date
    debt_free_date = None
    if not hit_horizon:
        today = date.today()
        debt_free_date = today + relativedelta(months=month)

    # Sum per-debt interest from schedule
    for d in working:
        dr = debt_results[d.id]
        dr.total_interest_paid = sum(
            snap.interest_accrued.get(d.id, Decimal("0")) for snap in schedule
        )

    return SimulateResult(
        total_months=month,
        debt_free_date=debt_free_date,
        total_interest=total_interest.quantize(CENTS, rounding=ROUND_HALF_UP),
        debt_results=list(debt_results.values()),
        schedule=schedule,
        warnings=warnings,
        hit_horizon=hit_horizon,
    )
