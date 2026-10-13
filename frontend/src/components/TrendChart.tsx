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
  className?: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// Compact axis money that never collapses distinct ticks: $850, $1.2k, $12k
function formatAxisMoney(v: number): string {
  if (Math.abs(v) < 1000) return `$${Math.round(v)}`;
  return `$${(v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1)}k`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** 0..max in 4 "nice" steps (1, 2, 2.5, 5 x 10^n), so ticks read $0 $5k $10k $15k $20k. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const raw = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

export function TrendChart({ trend, className }: TrendChartProps) {
  if (trend.length < 2) {
    return (
      <Card className={className}>
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
    <Card className={className}>
      <div className="panel-title"><h2>Total owed, 90 days</h2></div>
      <ResponsiveContainer width="100%" height={200}>
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
            interval="equidistantPreserveStart"
            minTickGap={36}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisMoney}
            domain={[0, niceTicks(Math.max(...data.map((d) => d.balance)))[niceTicks(Math.max(...data.map((d) => d.balance))).length - 1]]}
            ticks={niceTicks(Math.max(...data.map((d) => d.balance)))}
            width={52}
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
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
