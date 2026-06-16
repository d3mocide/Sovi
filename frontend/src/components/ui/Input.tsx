import React, { useState } from "react";
import { theme } from "../../theme";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Sovi Input — labelled field on a sunken navy fill. Errors are amber (never
 * red) and stated as fact. Focus shows the calm sky ring.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const borderColor = error
      ? theme.colors.warning
      : focused
        ? theme.colors.accent
        : theme.colors.border;

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
          ref={ref}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            background: theme.colors.inputFill,
            border: `1px solid ${borderColor}`,
            borderRadius: theme.radius.sm,
            padding: "10px 14px",
            color: theme.colors.text,
            fontSize: "14px",
            outline: "none",
            width: "100%",
            boxShadow: focused && !error ? theme.shadow.focus : "none",
            transition: `border-color ${theme.motion.durFast} ${theme.motion.easeStandard}, box-shadow ${theme.motion.durFast}`,
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
);

Input.displayName = "Input";
