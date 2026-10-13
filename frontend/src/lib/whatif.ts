/**
 * Debt projection under a constant monthly net borrowing figure.
 *
 * balance(t+1) = balance(t) * (1 + apr/12) + netBorrowing
 *
 * netBorrowing is new card spending minus what you pay toward the cards, excluding interest
 * (which this model adds itself). Positive means the balance keeps growing from spending;
 * negative is net paydown. One blended APR is used for all cards, weighted by balance.
 */
export interface Projection {
  path: number[]; // balance at month 0..n (n <= horizon)
  monthsToZero: number | null; // null when it never reaches zero within the horizon
  interestPaid: number; // total interest until payoff (or over the horizon)
}

export function blendedApr(debts: { balance: number; apr: number }[]): number {
  const total = debts.reduce((a, d) => a + d.balance, 0);
  if (total <= 0) return 0;
  return debts.reduce((a, d) => a + d.apr * d.balance, 0) / total;
}

export function project(balance0: number, aprPct: number, netBorrowing: number, horizon = 600): Projection {
  const r = aprPct / 1200;
  const path = [balance0];
  let b = balance0;
  let interest = 0;
  for (let m = 1; m <= horizon; m++) {
    const i = b * r;
    interest += i;
    b = b + i + netBorrowing;
    if (b <= 0.005) {
      path.push(0);
      return { path, monthsToZero: m, interestPaid: interest };
    }
    path.push(b);
    if (b > balance0 * 50) break; // runaway growth: stop early, it is clearly not paying off
  }
  return { path, monthsToZero: null, interestPaid: interest };
}
