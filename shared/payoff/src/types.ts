export interface Debt {
  id: string;
  balance: number;        // current balance (positive = owed)
  apr: number;            // annual %, e.g. 24.99
  minPaymentType: "fixed" | "percent";
  minPaymentValue: number; // $ if fixed, % (e.g. 1.0) if percent
  minPaymentFloor?: number; // floor for percent-based (e.g. $25)
}

export type Strategy = "avalanche" | "snowball" | "custom";

export interface SimulateInput {
  debts: Debt[];
  extraMonthly: number;
  strategy: Strategy;
  customOrder?: string[]; // ordered debt ids, for strategy="custom"
  horizonMonths?: number; // max months before giving up (default 600)
}

export interface MonthSnapshot {
  month: number;
  // per-debt state at end of month
  balances: Record<string, number>;
  interestAccrued: Record<string, number>;
  payments: Record<string, number>;
}

export interface DebtResult {
  id: string;
  payoffMonth: number | null;   // null if not paid off within horizon
  totalInterestPaid: number;
}

export interface SimulateResult {
  totalMonths: number;           // months until all debts paid (or horizon)
  debtFreeDate: Date | null;     // null if horizon hit
  totalInterest: number;
  debtResults: DebtResult[];
  schedule: MonthSnapshot[];     // full month-by-month history
  warnings: string[];            // e.g. "negative amortization" warnings
  hitHorizon: boolean;
}
