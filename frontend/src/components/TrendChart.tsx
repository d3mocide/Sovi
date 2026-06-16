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
import { Eyebrow } from "./ui/Stat";
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
        <Eyebrow style={{ marginBottom: "8px" }}>90-day trend</Eyebrow>
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
      <Eyebrow style={{ marginBottom: "16px" }}>90-day trend</Eyebrow>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            {/* The falling debt line — Sovi's own "imagery". */}
            <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--data-1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--data-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-strong)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
            }}
            formatter={(v: number) => [formatCurrency(v), "Total debt"]}
            labelStyle={{ color: "var(--text-muted)" }}
            cursor={{ stroke: "var(--border-strong)" }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--data-1)"
            strokeWidth={2}
            fill="url(#debtGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
