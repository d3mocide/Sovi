import { simulate, resolveMinPayment } from "@sovi/payoff";
import type { Debt, SimulateResult } from "@sovi/payoff";

export type MethodId = "avalanche" | "snowball" | "utilization" | "cashflow" | "custom";

export interface PlanDebt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  type: "credit_card" | "loan";
  limit: number | null;
  debt: Debt; // engine input
  minPayment: number; // what the minimum would be next month
}

export interface Method {
  id: MethodId;
  name: string;
  tagline: string;
  how: string;
  why: string;
  tradeoff: string;
  bestWhen: string;
}

export const METHODS: Method[] = [
  {
    id: "avalanche",
    name: "Avalanche",
    tagline: "Highest interest rate first",
    how: "Pay the minimum on every debt. Put every spare dollar on the debt with the highest APR. When it is gone, roll its whole payment onto the next-highest APR.",
    why: "It is the cheapest way to get out of debt: every extra dollar kills the most expensive interest first.",
    tradeoff: "If your highest-APR debt is also large, the first win can be a long way off.",
    bestWhen: "You want to pay the least interest and can stay motivated without quick wins.",
  },
  {
    id: "snowball",
    name: "Snowball",
    tagline: "Smallest balance first",
    how: "Pay the minimum on every debt. Put every spare dollar on the smallest balance. When it is paid off, add its payment to the next-smallest balance, so the payment grows like a rolling snowball.",
    why: "You close accounts fast, which frees up minimum payments and gives early wins that keep people going.",
    tradeoff: "Usually costs somewhat more interest than avalanche.",
    bestWhen: "Motivation matters more than the last few dollars of interest.",
  },
  {
    id: "utilization",
    name: "Credit score",
    tagline: "Highest card utilization first",
    how: "Pay the minimum everywhere. Put the extra on the card closest to its credit limit. Loans without a limit come last, by APR.",
    why: "Card utilization (balance divided by limit) is one of the biggest parts of a credit score. Bringing maxed-out cards down helps most, especially under 30%.",
    tradeoff: "Ignores interest rate, so it can cost more than avalanche.",
    bestWhen: "You plan to apply for a mortgage, car loan or new card soon.",
  },
  {
    id: "cashflow",
    name: "Cash flow",
    tagline: "Most monthly payment freed per dollar",
    how: "Rank debts by balance divided by minimum payment, lowest first. Pay those off first, because each dollar you spend frees up the most monthly payment.",
    why: "It rebuilds breathing room in your monthly budget the fastest, which then speeds up everything after it.",
    tradeoff: "Not the cheapest and not the quickest win; it optimises your monthly cash.",
    bestWhen: "Your budget is tight each month and you need the minimums to shrink quickly.",
  },
  {
    id: "custom",
    name: "Custom order",
    tagline: "You choose the order",
    how: "Pick the order yourself with the arrows. The extra money goes to the top debt, then rolls down the list.",
    why: "Sometimes the right answer is personal: a loan from family, a promotional rate that is about to end, or a card you want closed.",
    tradeoff: "Whatever order you choose, check the comparison table to see what it costs.",
    bestWhen: "You have a reason that the numbers alone do not capture.",
  },
];

export function toPlanDebts(
  rows: { account_id: string; name: string; current_balance: number | string; apr: number | string | null; account_type: string | null; credit_limit: number | string | null; min_payment_type: string | null; min_payment_value: number | string | null; min_payment_floor: number | string | null }[]
): PlanDebt[] {
  return rows
    .filter((d) => d.apr != null && Number(d.current_balance) > 0)
    .map((d) => {
      const balance = Number(d.current_balance);
      const apr = Number(d.apr);
      const debt: Debt = {
        id: d.account_id,
        balance,
        apr,
        minPaymentType: (d.min_payment_type ?? "percent") as Debt["minPaymentType"],
        minPaymentValue: Number(d.min_payment_value ?? 1),
        minPaymentFloor: d.min_payment_floor != null ? Number(d.min_payment_floor) : 25,
      };
      const interest = (balance * apr) / 1200;
      return {
        id: d.account_id,
        name: d.name,
        balance,
        apr,
        type: d.account_type === "loan" ? "loan" : "credit_card",
        limit: d.credit_limit != null ? Number(d.credit_limit) : null,
        debt,
        minPayment: resolveMinPayment(debt, balance + interest, interest),
      };
    });
}

/** Priority order (first = gets the extra money) for a method, using starting numbers. */
export function orderFor(method: MethodId, debts: PlanDebt[], custom: string[]): string[] {
  const by = (cmp: (a: PlanDebt, b: PlanDebt) => number) => [...debts].sort(cmp).map((d) => d.id);
  switch (method) {
    case "avalanche":
      return by((a, b) => b.apr - a.apr);
    case "snowball":
      return by((a, b) => a.balance - b.balance);
    case "utilization": {
      const util = (d: PlanDebt) => (d.limit && d.limit > 0 ? d.balance / d.limit : -1);
      return by((a, b) => util(b) - util(a) || b.apr - a.apr);
    }
    case "cashflow":
      return by((a, b) => a.balance / Math.max(a.minPayment, 0.01) - b.balance / Math.max(b.minPayment, 0.01));
    case "custom": {
      const known = custom.filter((id) => debts.some((d) => d.id === id));
      const rest = debts.map((d) => d.id).filter((id) => !known.includes(id));
      return [...known, ...rest];
    }
  }
}

export interface MethodRun {
  method: MethodId;
  order: string[];
  result: SimulateResult;
  firstWinMonth: number | null; // month the first debt is fully paid
}

export function run(method: MethodId, debts: PlanDebt[], extra: number, custom: string[]): MethodRun {
  const order = orderFor(method, debts, custom);
  const strategy = method === "avalanche" || method === "snowball" ? method : "custom";
  const result = simulate({
    debts: debts.map((d) => d.debt),
    extraMonthly: extra,
    strategy,
    customOrder: order,
  });
  const months = result.debtResults.map((r) => r.payoffMonth).filter((m): m is number => m != null);
  return { method, order, result, firstWinMonth: months.length ? Math.min(...months) : null };
}
