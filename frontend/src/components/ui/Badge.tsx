import React from "react";
import { theme } from "../../theme";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "positive" | "warning" | "muted";
  style?: React.CSSProperties;
}

/**
 * Sovi Badge — status pill. Tints at ~15% fill + ~30% border. Status is always
 * color + word (never color alone, never emoji).
 */
export function Badge({ children, variant = "default", style }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: theme.colors.border,
      color: theme.colors.text,
    },
    accent: {
      background: theme.colors.accentTint,
      color: theme.colors.accent,
      border: `1px solid ${theme.colors.accentTintBorder}`,
    },
    positive: {
      background: theme.colors.positiveTint,
      color: theme.colors.positive,
      border: `1px solid ${theme.colors.positiveTintBorder}`,
    },
    warning: {
      background: theme.colors.warningTint,
      color: theme.colors.warning,
      border: `1px solid ${theme.colors.warningTintBorder}`,
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
        borderRadius: theme.radius.pill,
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
