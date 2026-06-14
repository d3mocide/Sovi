import React from "react";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { theme } from "../theme";
import type { DebtProgress } from "../hooks/useGamification";

interface DebtProgressListProps {
  debts: DebtProgress[];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DebtProgressList({ debts }: DebtProgressListProps) {
  if (debts.length === 0) {
    return (
      <Card>
        <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
          No debts configured yet.
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {debts.map((debt) => (
        <Card key={debt.account_id} style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "10px",
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "15px", color: theme.colors.text }}>
                {debt.name}
              </p>
              {debt.apr !== null && (
                <p style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "2px" }}>
                  {debt.apr}% APR
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: 600, fontSize: "15px", color: theme.colors.text }}>
                {formatCurrency(debt.current_balance)}
              </p>
              <p style={{ fontSize: "12px", color: theme.colors.positive, marginTop: "2px" }}>
                {debt.progress_pct.toFixed(0)}% paid
              </p>
            </div>
          </div>
          <ProgressBar value={debt.progress_pct} color={theme.colors.positive} />
          {debt.payoff_month !== null && (
            <p
              style={{
                fontSize: "12px",
                color: theme.colors.textMuted,
                marginTop: "8px",
              }}
            >
              Payoff in ~{debt.payoff_month} months
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
