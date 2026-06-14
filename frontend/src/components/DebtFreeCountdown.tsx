import React from "react";
import { Card } from "./ui/Card";
import { theme } from "../theme";

interface DebtFreeCountdownProps {
  debtFreeDate: string | null;
  daysUntil: number | null;
  totalDebt: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DebtFreeCountdown({
  debtFreeDate,
  daysUntil,
  totalDebt,
}: DebtFreeCountdownProps) {
  if (!debtFreeDate || daysUntil === null) {
    return (
      <Card>
        <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
          Add a debt to see your payoff date.
        </p>
      </Card>
    );
  }

  const months = Math.round(daysUntil / 30);

  return (
    <Card>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.colors.textMuted,
          marginBottom: "12px",
        }}
      >
        Debt-free in
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
        <span
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: theme.colors.accent,
            lineHeight: 1,
          }}
        >
          {months}
        </span>
        <span style={{ fontSize: "20px", color: theme.colors.textMuted, fontWeight: 500 }}>
          months
        </span>
      </div>
      <p style={{ color: theme.colors.textMuted, fontSize: "14px", marginTop: "8px" }}>
        {formatDate(debtFreeDate)}
      </p>
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: "13px",
          marginTop: "4px",
          opacity: 0.7,
        }}
      >
        {formatCurrency(totalDebt)} remaining
      </p>
    </Card>
  );
}
