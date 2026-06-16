import React from "react";
import { theme } from "../../theme";

/**
 * Eyebrow — the recurring uppercase section caption.
 * Inter 600, 12px, tracking 0.08em, muted.
 */
export function Eyebrow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.colors.textMuted,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/**
 * Numeral — every financial figure (balance, APR, countdown, date) renders in
 * JetBrains Mono, tabular, with tight tracking. Brand rule: numerals are mono.
 */
export function Numeral({
  children,
  style,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  as?: "span" | "p" | "div";
}) {
  return (
    <Tag
      className="sovi-numeral"
      style={{
        fontFamily: theme.fonts.mono,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

type Tone = "accent" | "positive" | "neutral" | "attention";

const TONE_COLOR: Record<Tone, string> = {
  accent: theme.colors.accent,
  positive: theme.colors.positive,
  neutral: theme.colors.text,
  attention: theme.colors.warning,
};

/**
 * StatBlock — eyebrow + big mono numeral, the signature dashboard moment.
 */
export function StatBlock({
  label,
  value,
  unit,
  caption,
  tone = "accent",
  size = "lg",
  align = "left",
  style,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  caption?: React.ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center";
  style?: React.CSSProperties;
}) {
  const valueSize = { sm: "20px", md: "32px", lg: "48px", xl: "56px" }[size];

  return (
    <div style={{ textAlign: align, ...style }}>
      <Eyebrow style={{ marginBottom: "10px" }}>{label}</Eyebrow>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        <Numeral
          style={{
            fontWeight: 700,
            fontSize: valueSize,
            lineHeight: 1,
            color: TONE_COLOR[tone],
          }}
        >
          {value}
        </Numeral>
        {unit && (
          <span style={{ fontSize: "20px", color: theme.colors.textMuted, fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>
      {caption && (
        <p style={{ color: theme.colors.textMuted, fontSize: "14px", marginTop: "8px" }}>
          {caption}
        </p>
      )}
    </div>
  );
}
