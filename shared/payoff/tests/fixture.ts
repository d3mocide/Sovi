import { Debt } from "../src/types";

export const threeDebtFixture: Debt[] = [
  {
    id: "card-a",
    balance: 3000,
    apr: 22.99,
    minPaymentType: "percent",
    minPaymentValue: 2,
    minPaymentFloor: 36, // floor high enough for payoff within 600 months (22.99% APR needs floor > ~35)
  },
  {
    id: "card-b",
    balance: 1200,
    apr: 18.99,
    minPaymentType: "fixed",
    minPaymentValue: 35,
  },
  {
    id: "loan-c",
    balance: 8500,
    apr: 9.99,
    minPaymentType: "fixed",
    minPaymentValue: 175,
  },
];

// Hand-computed ground truth (you must compute these or use a known-good amortization calculator):
// With extraMonthly=200, avalanche strategy:
// Expected: all debts paid off, no negative amortization
// card-b (lowest APR after card-a? No — avalanche = highest APR first)
// Avalanche order: card-a (22.99%) → card-b (18.99%) → loan-c (9.99%)
