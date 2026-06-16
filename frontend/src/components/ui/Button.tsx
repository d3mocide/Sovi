import React from "react";
import { theme } from "../../theme";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * Sovi Button — sky primary with dark text, bordered secondary, quiet ghost,
 * and an amber "danger" (never red). Motion is calm: press shifts color, never
 * scale; nothing bounces.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: theme.radius.sm,
    fontFamily: theme.fonts.sans,
    fontWeight: 500,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: `background ${theme.motion.durFast} ${theme.motion.easeStandard}, opacity ${theme.motion.durFast}`,
    border: "1px solid transparent",
    outline: "none",
    whiteSpace: "nowrap",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "14px 28px", fontSize: "16px" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: theme.colors.accent,
      color: theme.colors.onAccent,
    },
    secondary: {
      background: theme.colors.surface,
      color: theme.colors.text,
      borderColor: theme.colors.border,
    },
    ghost: {
      background: "transparent",
      color: theme.colors.textMuted,
    },
    danger: {
      background: theme.colors.warningTint,
      color: theme.colors.warning,
      borderColor: theme.colors.warning,
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizeStyles[size], ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading ? (
        "Loading…"
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}
