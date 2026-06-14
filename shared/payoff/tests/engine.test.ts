import { simulate, simulateSideBySide } from "../src";
import { computeBaseline } from "../src/baseline";
import { threeDebtFixture } from "./fixture";

describe("payoff engine", () => {
  test("all debts paid off with sufficient extra payment", () => {
    const result = simulate({
      debts: threeDebtFixture,
      extraMonthly: 200,
      strategy: "avalanche",
    });
    expect(result.hitHorizon).toBe(false);
    expect(result.totalMonths).toBeGreaterThan(0);
    expect(result.totalMonths).toBeLessThan(200);
    result.debtResults.forEach(d => {
      expect(d.payoffMonth).not.toBeNull();
    });
  });

  test("avalanche pays less interest than snowball", () => {
    const comparison = simulateSideBySide(threeDebtFixture, 200);
    expect(comparison.interestDelta).toBeGreaterThanOrEqual(0); // avalanche ≤ snowball cost
  });

  test("avalanche order: highest APR first", () => {
    const result = simulate({
      debts: threeDebtFixture,
      extraMonthly: 200,
      strategy: "avalanche",
    });
    const cardA = result.debtResults.find(d => d.id === "card-a")!;
    const loanC = result.debtResults.find(d => d.id === "loan-c")!;
    expect(cardA.payoffMonth!).toBeLessThan(loanC.payoffMonth!);
  });

  test("snowball order: lowest balance first", () => {
    const result = simulate({
      debts: threeDebtFixture,
      extraMonthly: 200,
      strategy: "snowball",
    });
    // card-b (balance 1200) should pay off before card-a (3000) before loan-c (8500)
    const cardB = result.debtResults.find(d => d.id === "card-b")!;
    const cardA = result.debtResults.find(d => d.id === "card-a")!;
    expect(cardB.payoffMonth!).toBeLessThan(cardA.payoffMonth!);
  });

  test("no extra payment still pays off eventually", () => {
    const result = simulate({
      debts: threeDebtFixture,
      extraMonthly: 0,
      strategy: "avalanche",
    });
    expect(result.hitHorizon).toBe(false);
    expect(result.warnings.length).toBe(0);
  });

  test("interest saved is positive with extra payment", () => {
    const baseline = computeBaseline(threeDebtFixture);
    const result = simulate({ debts: threeDebtFixture, extraMonthly: 200, strategy: "avalanche" });
    const saved = baseline.totalInterest - result.totalInterest;
    expect(saved).toBeGreaterThan(0);
  });

  test("negative amortization guard triggers", () => {
    const badDebt: typeof threeDebtFixture = [{
      id: "trap",
      balance: 10000,
      apr: 99.99,                    // very high APR
      minPaymentType: "fixed",
      minPaymentValue: 1,            // $1 minimum — will never pay off
    }];
    const result = simulate({ debts: badDebt, extraMonthly: 0, strategy: "avalanche" });
    expect(result.hitHorizon).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test("schedule length equals totalMonths", () => {
    const result = simulate({ debts: threeDebtFixture, extraMonthly: 200, strategy: "avalanche" });
    expect(result.schedule.length).toBe(result.totalMonths);
  });

  test("balances never go negative", () => {
    const result = simulate({ debts: threeDebtFixture, extraMonthly: 500, strategy: "snowball" });
    result.schedule.forEach(snap => {
      Object.values(snap.balances).forEach(b => {
        expect(b).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
