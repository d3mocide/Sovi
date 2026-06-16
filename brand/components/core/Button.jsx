import React from "react";

/**
 * Sovi Button — primary action primitive.
 * Faithful to frontend/src/components/ui/Button.tsx: sky primary with dark
 * text, bordered secondary, quiet ghost, and an amber "danger" (never red).
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft = null,
  iconRight = null,
  children,
  disabled,
  style = {},
  ...props
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "background var(--dur-fast) var(--ease-standard), opacity var(--dur-fast)",
    border: "1px solid transparent",
    outline: "none",
    whiteSpace: "nowrap",
  };

  const sizes = {
    sm: { padding: "6px 12px", fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "14px 28px", fontSize: "16px" },
  };

  const variants = {
    primary: { background: "var(--accent)", color: "var(--text-on-accent)" },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-body)",
      borderColor: "var(--border-hairline)",
    },
    ghost: { background: "transparent", color: "var(--text-muted)" },
    danger: {
      background: "var(--attention-tint)",
      color: "var(--attention)",
      borderColor: "var(--attention)",
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      {...props}
    >
      {loading ? "Loading…" : (<>{iconLeft}{children}{iconRight}</>)}
    </button>
  );
}
