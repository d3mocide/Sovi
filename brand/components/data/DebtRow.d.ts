import * as React from "react";

export interface DebtRowProps {
  /** Account / debt name. */
  name: string;
  /** Annual percentage rate (number, shown as "N% APR"). */
  apr?: number | null;
  /** Current balance in USD. */
  balance: number;
  /** Percent paid off, 0–100. */
  progressPct?: number;
  /** Estimated months to payoff. */
  payoffMonths?: number | null;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * One debt's payoff card — name + APR, balance + "% paid", emerald progress
 * bar, optional payoff estimate. The atomic unit of the dashboard debt list.
 *
 * @startingPoint section="Data" subtitle="Per-debt payoff progress card" viewport="700x140"
 */
export function DebtRow(props: DebtRowProps): JSX.Element;
