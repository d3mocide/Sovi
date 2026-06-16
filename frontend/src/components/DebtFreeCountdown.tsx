import React from "react";
import { Card } from "./ui/Card";
import { StatBlock, Numeral } from "./ui/Stat";
import { Icon } from "./ui/Icon";
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
    <Card
      style={{
        background: "linear-gradient(160deg, var(--surface-card), var(--bg-raised))",
      }}
    >
      {/* The hero stat — mono 56px countdown, the signature moment. */}
      <StatBlock label="Debt-free in" value={months} unit="months" size="xl" tone="accent" />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "12px",
          color: theme.colors.textMuted,
        }}
      >
        <Icon name="calendar" size={15} />
        <Numeral style={{ fontSize: "14px" }}>{formatDate(debtFreeDate)}</Numeral>
      </div>
      <p
        style={{
          color: theme.colors.textFaint,
          fontSize: "13px",
          marginTop: "4px",
        }}
      >
        <Numeral>{formatCurrency(totalDebt)}</Numeral> remaining
      </p>
    </Card>
  );
}
