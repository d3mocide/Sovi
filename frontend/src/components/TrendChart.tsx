import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card } from "./ui/Card";
import { theme } from "../theme";
import type { TrendPoint } from "../hooks/useGamification";

interface TrendChartProps {
  trend: TrendPoint[];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ trend }: TrendChartProps) {
  if (trend.length < 2) {
    return (
      <Card>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
            marginBottom: "8px",
          }}
        >
          90-day Trend
        </p>
        <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
          Not enough data yet.
        </p>
      </Card>
    );
  }

  const data = trend.map((p) => ({
    date: formatDate(p.date),
    balance: Number(p.total_balance),
  }));

  return (
    <Card>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.colors.textMuted,
          marginBottom: "16px",
        }}
      >
        90-day Trend
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.accent} stopOpacity={0.3} />
              <stop offset="95%" stopColor={theme.colors.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.text,
              fontSize: "13px",
            }}
            formatter={(v: number) => [formatCurrency(v), "Total debt"]}
            labelStyle={{ color: theme.colors.textMuted }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={theme.colors.accent}
            strokeWidth={2}
            fill="url(#debtGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
