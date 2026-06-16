import React from "react";

/**
 * Sovi StatBlock — the recurring "eyebrow + big mono numeral" pattern used
 * across the dashboard (Interest saved, Debt-free countdown, Total interest).
 * Numerals are mono + tabular so figures align and read as data.
 */
export function StatBlock({
  label,
  value,
  unit,
  caption,
  tone = "accent",
  size = "lg",
  align = "left",
  style = {},
}) {
  const toneColor = {
    accent: "var(--accent)",
    positive: "var(--positive)",
    neutral: "var(--text-strong)",
    attention: "var(--attention)",
  }[tone];

  const valueSize = { sm: "20px", md: "32px", lg: "48px", xl: "56px" }[size];

  return (
    <div style={{ textAlign: align, ...style }}>
      <p
        className="sovi-eyebrow"
        style={{
          letterSpacing: "var(--tracking-caps)",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", justifyContent: align === "center" ? "center" : "flex-start" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: valueSize,
            lineHeight: 1,
            letterSpacing: "var(--tracking-tight)",
            fontVariantNumeric: "tabular-nums",
            color: toneColor,
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: "20px", color: "var(--text-muted)", fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>
      {caption && (
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>
          {caption}
        </p>
      )}
    </div>
  );
}
