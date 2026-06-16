import React from "react";
import { Card } from "../core/Card.jsx";

/**
 * Sovi StreakChip — a gamification badge. Big mono count + label + optional
 * "Best: N". Count goes emerald when active, muted at zero. Mirrors
 * StreakBadges.tsx. Calm reward, never guilt.
 */
export function StreakChip({ count, label, best, style = {} }) {
  const active = count > 0;
  return (
    <Card style={{ padding: "14px 18px", minWidth: "120px", flexShrink: 0, textAlign: "center", ...style }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "28px",
          fontWeight: 700,
          color: active ? "var(--positive)" : "var(--text-muted)",
          lineHeight: 1,
          marginBottom: "6px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
      {best > 0 && (
        <div style={{ fontSize: "10px", color: "var(--text-muted)", opacity: 0.6, marginTop: "4px" }}>
          Best: {best}
        </div>
      )}
    </Card>
  );
}
