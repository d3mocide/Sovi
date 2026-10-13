import React from "react";
import { Card } from "./Card";
import { Numeral } from "./Stat";

type Tone = "neutral" | "positive" | "attention";
const TONE: Record<Tone, string> = {
  neutral: "var(--text-strong)",
  positive: "var(--positive)",
  attention: "var(--attention)",
};

/** Compact KPI tile: caps label, big mono value, one quiet line underneath. */
export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={className} style={{ padding: "18px 20px" }}>
      <p style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </p>
      <Numeral as="p" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.1, marginTop: 10, color: TONE[tone] }}>
        {value}
      </Numeral>
      {sub && <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>{sub}</p>}
    </Card>
  );
}
