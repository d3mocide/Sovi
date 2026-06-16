import React from "react";

/**
 * Sovi Badge — small status pill. Tinted fill + matching border at low
 * opacity. Calm semantics: accent / positive / attention (amber) / muted.
 * Mirrors frontend/src/components/ui/Badge.tsx.
 */
export function Badge({ children, variant = "default", style = {}, ...props }) {
  const variants = {
    default: { background: "var(--border-hairline)", color: "var(--text-body)" },
    accent: {
      background: "var(--accent-tint)",
      color: "var(--accent)",
      border: "1px solid var(--accent-tint-border)",
    },
    positive: {
      background: "var(--positive-tint)",
      color: "var(--positive)",
      border: "1px solid var(--emerald-glow-strong)",
    },
    warning: {
      background: "var(--attention-tint)",
      color: "var(--attention)",
      border: "1px solid var(--amber-glow-strong)",
    },
    muted: {
      background: "rgba(148,163,184,0.1)",
      color: "var(--text-muted)",
    },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "var(--radius-pill)",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
