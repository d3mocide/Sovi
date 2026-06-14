import React from "react";
import { theme } from "../../theme";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "positive" | "warning" | "muted";
  style?: React.CSSProperties;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: theme.colors.border,
      color: theme.colors.text,
    },
    accent: {
      background: "rgba(56,189,248,0.15)",
      color: theme.colors.accent,
      border: `1px solid rgba(56,189,248,0.3)`,
    },
    positive: {
      background: "rgba(52,211,153,0.15)",
      color: theme.colors.positive,
      border: `1px solid rgba(52,211,153,0.3)`,
    },
    warning: {
      background: "rgba(251,191,36,0.15)",
      color: theme.colors.warning,
      border: `1px solid rgba(251,191,36,0.3)`,
    },
    muted: {
      background: "rgba(148,163,184,0.1)",
      color: theme.colors.textMuted,
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 500,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
