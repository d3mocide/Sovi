import { Debt, SimulateInput, SimulateResult, MonthSnapshot, DebtResult, Strategy } from "./types";

/** Round a monetary value to 2 decimal places. */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Resolve the minimum payment due for a debt given its current balance.
 * Never returns more than the balance (can't overpay).
 */
export function resolveMinPayment(debt: Debt, balance: number): number {
  if (debt.minPaymentType === "fixed") {
    return Math.min(debt.minPaymentValue, balance);
  }
  // percent-based
  const pct = balance * (debt.minPaymentValue / 100);
  const floor = debt.minPaymentFloor ?? 0;
  return Math.min(Math.max(pct, floor), balance);
}

/** A debt is considered "active" if its balance exceeds this epsilon. */
const ACTIVE_THRESHOLD = 0.001;

/**
 * Sort active debt IDs by strategy.
 * `balances` is the current balance map (after minimums are applied, for snowball).
 */
function sortByStrategy(
  activeIds: string[],
  debtMap: Map<string, Debt>,
  balances: Map<string, number>,
  strategy: Strategy,
  customOrder?: string[]
): string[] {
  const sorted = [...activeIds];
  if (strategy === "avalanche") {
    sorted.sort((a, b) => (debtMap.get(b)!.apr) - (debtMap.get(a)!.apr));
  } else if (strategy === "snowball") {
    sorted.sort((a, b) => (balances.get(a) ?? 0) - (balances.get(b) ?? 0));
  } else if (strategy === "custom" && customOrder) {
    const indexMap = new Map(customOrder.map((id, i) => [id, i]));
    sorted.sort((a, b) => {
      const ia = indexMap.has(a) ? indexMap.get(a)! : Infinity;
      const ib = indexMap.has(b) ? indexMap.get(b)! : Infinity;
      return ia - ib;
    });
  }
  return sorted;
}

/**
 * Simulate debt payoff.
 */
export function simulate(input: SimulateInput): SimulateResult {
  const { debts, extraMonthly, strategy, customOrder } = input;
  const horizonMonths = input.horizonMonths ?? 600;

  // Build working state
  const balances = new Map<string, number>(debts.map(d => [d.id, d.balance]));
  const debtMap = new Map<string, Debt>(debts.map(d => [d.id, d]));
  const totalInterestByDebt = new Map<string, number>(debts.map(d => [d.id, 0]));
  const payoffMonth = new Map<string, number | null>(debts.map(d => [d.id, null]));

  const schedule: MonthSnapshot[] = [];
  const warnings: string[] = [];
  let hitHorizon = false;
  let totalInterest = 0;
  let month = 0;

  // Check for negative amortization before starting
  for (const debt of debts) {
    const bal = balances.get(debt.id)!;
    if (bal > ACTIVE_THRESHOLD) {
      const monthlyInterest = bal * (debt.apr / 100 / 12);
      const minPay = resolveMinPayment(debt, bal);
      if (minPay <= monthlyInterest) {
        warnings.push(
          `Debt "${debt.id}" has negative amortization: minimum payment ($${minPay.toFixed(2)}) ` +
          `does not exceed monthly interest ($${monthlyInterest.toFixed(2)}). ` +
          `This debt will never pay off without extra payments.`
        );
        hitHorizon = true;
      }
    }
  }

  // If negative amortization detected with no extra payment to help, simulate up to horizon
  // but still run the loop (we stop at horizon anyway)

  while (month < horizonMonths) {
    // Check if all debts are paid off
    const activeIds = debts
      .map(d => d.id)
      .filter(id => (balances.get(id) ?? 0) > ACTIVE_THRESHOLD);

    if (activeIds.length === 0) {
      break;
    }

    month += 1;

    const interestAccrued: Record<string, number> = {};
    const payments: Record<string, number> = {};

    // Step 1: Accrue interest on all active debts
    for (const id of activeIds) {
      const bal = balances.get(id)!;
      const interest = bal * (debtMap.get(id)!.apr / 100 / 12);
      const newBal = bal + interest;
      balances.set(id, newBal);
      interestAccrued[id] = interest;
      totalInterest += interest;
      totalInterestByDebt.set(id, (totalInterestByDebt.get(id) ?? 0) + interest);
    }

    // Re-check active (still same after interest, but balance changed)
    const activeAfterInterest = debts
      .map(d => d.id)
      .filter(id => (balances.get(id) ?? 0) > ACTIVE_THRESHOLD);

    // Step 2: Compute minimums and pay them; freed minimums roll into pool
    let pool = extraMonthly;
    for (const id of activeAfterInterest) {
      const bal = balances.get(id)!;
      const minDue = resolveMinPayment(debtMap.get(id)!, bal);
      const pay = Math.min(minDue, bal);
      const newBal = Math.max(0, bal - pay);
      balances.set(id, newBal);
      payments[id] = (payments[id] ?? 0) + pay;
      pool += (minDue - pay); // freed min if debt paid off early
    }

    // Step 3: Apply pool to priority debts in strategy order
    // Sort by strategy using balances AFTER minimums (for snowball: lowest remaining balance first)
    const activeForPool = debts
      .map(d => d.id)
      .filter(id => (balances.get(id) ?? 0) > ACTIVE_THRESHOLD);

    const sortedIds = sortByStrategy(activeForPool, debtMap, balances, strategy, customOrder);

    for (const id of sortedIds) {
      if (pool <= 0) break;
      const bal = balances.get(id)!;
      const pay = Math.min(pool, bal);
      const newBal = Math.max(0, bal - pay);
      balances.set(id, newBal);
      payments[id] = (payments[id] ?? 0) + pay;
      pool -= pay;
    }

    // Step 4: Round balances at end of month and record payoffs
    const endBalances: Record<string, number> = {};
    for (const debt of debts) {
      const rawBal = balances.get(debt.id)!;
      const roundedBal = round2(rawBal);
      // Clamp to zero if very small (floating point dust)
      const finalBal = roundedBal < ACTIVE_THRESHOLD ? 0 : roundedBal;
      balances.set(debt.id, finalBal);
      endBalances[debt.id] = finalBal;

      // Record payoff month
      if (finalBal <= 0 && payoffMonth.get(debt.id) === null) {
        payoffMonth.set(debt.id, month);
      }
    }

    // Round interest accrued
    for (const id of Object.keys(interestAccrued)) {
      interestAccrued[id] = round2(interestAccrued[id]);
    }

    // Round payments
    for (const id of Object.keys(payments)) {
      payments[id] = round2(payments[id]);
    }

    // Fill in zero entries for inactive debts
    for (const debt of debts) {
      if (!(debt.id in interestAccrued)) interestAccrued[debt.id] = 0;
      if (!(debt.id in payments)) payments[debt.id] = 0;
    }

    schedule.push({
      month,
      balances: { ...endBalances },
      interestAccrued,
      payments,
    });
  }

  // If we exited the loop because of horizon (not because all paid off)
  const remainingActive = debts.filter(d => (balances.get(d.id) ?? 0) > ACTIVE_THRESHOLD);
  if (remainingActive.length > 0) {
    hitHorizon = true;
    if (!warnings.some(w => w.includes("negative amortization"))) {
      warnings.push(`Simulation hit the horizon of ${horizonMonths} months without paying off all debts.`);
    }
  }

  // Round total interest
  totalInterest = round2(totalInterest);

  // Build debtResults
  const debtResults: DebtResult[] = debts.map(d => ({
    id: d.id,
    payoffMonth: payoffMonth.get(d.id) ?? null,
    totalInterestPaid: round2(totalInterestByDebt.get(d.id) ?? 0),
  }));

  // Compute debtFreeDate
  let debtFreeDate: Date | null = null;
  if (!hitHorizon && month > 0) {
    const now = new Date();
    debtFreeDate = new Date(now.getFullYear(), now.getMonth() + month, now.getDate());
  }

  return {
    totalMonths: month,
    debtFreeDate,
    totalInterest,
    debtResults,
    schedule,
    warnings,
    hitHorizon,
  };
}

/**
 * Run both avalanche and snowball strategies and return a comparison.
 */
export function simulateSideBySide(
  debts: Debt[],
  extraMonthly: number
): {
  avalanche: SimulateResult;
  snowball: SimulateResult;
  monthsDelta: number;
  interestDelta: number;
} {
  const avalanche = simulate({ debts, extraMonthly, strategy: "avalanche" });
  const snowball = simulate({ debts, extraMonthly, strategy: "snowball" });
  return {
    avalanche,
    snowball,
    monthsDelta: snowball.totalMonths - avalanche.totalMonths,
    interestDelta: round2(snowball.totalInterest - avalanche.totalInterest),
  };
}
