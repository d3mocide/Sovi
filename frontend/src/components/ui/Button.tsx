import React from "react";
import { theme } from "../../theme";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
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
    fontWeight: 500,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "background 0.15s, opacity 0.15s",
    border: "none",
    outline: "none",
    fontFamily: theme.fonts.sans,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "14px 28px", fontSize: "16px" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: theme.colors.accent,
      color: "#0f172a",
    },
    secondary: {
      background: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
    },
    ghost: {
      background: "transparent",
      color: theme.colors.textMuted,
    },
    danger: {
      background: "rgba(251,191,36,0.15)",
      color: theme.colors.warning,
      border: `1px solid ${theme.colors.warning}`,
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizeStyles[size], ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
