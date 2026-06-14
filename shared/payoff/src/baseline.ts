import { Debt, SimulateInput } from "./types";
import { simulate, simulateSideBySide } from "./engine";

/**
 * Compute the minimums-only baseline (no extra payment).
 * Returns total interest paid if you only ever make minimum payments.
 */
export function computeBaseline(
  debts: Debt[],
  horizonMonths = 600
): { totalInterest: number; hitHorizon: boolean; warnings: string[] } {
  const result = simulate({
    debts,
    extraMonthly: 0,
    strategy: "avalanche", // doesn't matter with no extra
    horizonMonths,
  });
  return {
    totalInterest: result.totalInterest,
    hitHorizon: result.hitHorizon,
    warnings: result.warnings,
  };
}

/**
 * How much interest is saved compared to paying minimums only.
 */
export function interestSaved(
  input: SimulateInput,
  baselineTotalInterest: number
): number {
  const result = simulate(input);
  return Math.round((baselineTotalInterest - result.totalInterest) * 100) / 100;
}

export { simulateSideBySide };
