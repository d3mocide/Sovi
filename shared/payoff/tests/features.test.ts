import { simulate, resolveMinPayment } from "../src";
import type { Debt } from "../src";

const card = (over: Partial<Debt> = {}): Debt => ({
  id: "c", balance: 3000, apr: 24, minPaymentType: "interest_plus_percent", minPaymentValue: 1, minPaymentFloor: 25, ...over,
});

describe("interest_plus_percent minimums", () => {
  test("covers the month's interest plus 1% of the balance before it", () => {
    // balance after interest: 3000 + 60 = 3060; due = 60 + 3000 * 1% = 90
    expect(resolveMinPayment(card(), 3060, 60)).toBeCloseTo(90, 5);
  });
  test("a card on this rule always amortises", () => {
    const r = simulate({ debts: [card()], extraMonthly: 0, strategy: "avalanche" });
    expect(r.hitHorizon).toBe(false);
    expect(r.warnings.length).toBe(0);
  });
});

describe("lump sums (windfalls)", () => {
  test("a one-off payment shortens payoff and saves interest", () => {
    const base = simulate({ debts: [card()], extraMonthly: 50, strategy: "avalanche" });
    const lump = simulate({ debts: [card()], extraMonthly: 50, strategy: "avalanche", lumpSums: [{ month: 1, amount: 1000 }] });
    expect(lump.totalMonths).toBeLessThan(base.totalMonths);
    expect(lump.totalInterest).toBeLessThan(base.totalInterest);
  });
  test("a lump sum lands in its month only", () => {
    const r = simulate({ debts: [card()], extraMonthly: 0, strategy: "avalanche", lumpSums: [{ month: 3, amount: 500 }] });
    const p = (m: number) => r.schedule[m - 1].payments["c"];
    expect(p(3)).toBeGreaterThan(p(2) + 400);
    expect(p(4)).toBeLessThan(p(3));
  });
});

describe("promotional rates (balance transfers)", () => {
  test("0% for 12 months accrues no interest in that window", () => {
    const r = simulate({ debts: [card({ promo: { apr: 0, months: 12 } })], extraMonthly: 100, strategy: "avalanche" });
    for (let m = 0; m < 12; m++) expect(r.schedule[m].interestAccrued["c"] ?? 0).toBeCloseTo(0, 5);
  });
  test("the regular rate resumes after the promo", () => {
    const r = simulate({ debts: [card({ balance: 8000, promo: { apr: 0, months: 6 } })], extraMonthly: 0, strategy: "avalanche" });
    expect(r.schedule[5].interestAccrued["c"] ?? 0).toBeCloseTo(0, 5);
    expect(r.schedule[6].interestAccrued["c"]).toBeGreaterThan(50);
  });
  test("avalanche leaves a 0% promo debt for later, not first", () => {
    const promo = card({ id: "promo", balance: 2000, apr: 22, promo: { apr: 0, months: 12 } });
    const other = card({ id: "other", balance: 2000, apr: 18 });
    const r = simulate({ debts: [promo, other], extraMonthly: 300, strategy: "avalanche" });
    const m1 = r.schedule[0].payments;
    expect(m1["other"]).toBeGreaterThan(m1["promo"]);
  });
});
