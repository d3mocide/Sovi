import React from "react";
import { theme } from "../../theme";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: theme.colors.textMuted,
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          background: "#0f1f35",
          border: `1px solid ${error ? theme.colors.warning : theme.colors.border}`,
          borderRadius: theme.radius.sm,
          padding: "10px 14px",
          color: theme.colors.text,
          fontSize: "14px",
          outline: "none",
          width: "100%",
          transition: "border-color 0.15s",
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: "12px", color: theme.colors.warning }}>{error}</span>
      )}
    </div>
  );
}
