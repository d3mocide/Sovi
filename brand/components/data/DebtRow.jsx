import React from "react";
import { Card } from "../core/Card.jsx";
import { ProgressBar } from "../core/ProgressBar.jsx";

/**
 * Sovi DebtRow — a single debt's payoff card: name + APR on the left, balance
 * + "% paid" on the right, emerald progress bar, optional payoff estimate.
 * Mirrors DebtProgressList.tsx item.
 */
export function DebtRow({
  name,
  apr,
  balance,
  progressPct,
  payoffMonths,
  onClick,
  style = {},
}) {
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  return (
    <Card onClick={onClick} style={{ padding: "16px 20px", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-strong)" }}>{name}</p>
          {apr != null && (
            <p className="sovi-numeral" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              {apr}% APR
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="sovi-numeral" style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-strong)" }}>
            {fmt(balance)}
          </p>
          {progressPct != null && (
            <p style={{ fontSize: "12px", color: "var(--positive)", marginTop: "2px" }}>
              {Math.round(progressPct)}% paid
            </p>
          )}
        </div>
      </div>
      <ProgressBar value={progressPct ?? 0} color="var(--positive)" />
      {payoffMonths != null && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
          Payoff in ~{payoffMonths} months
        </p>
      )}
    </Card>
  );
}
