import React from "react";

/**
 * Sovi Input — labelled field with a sunken cool fill. Amber border on error
 * (never red). Mirrors frontend/src/components/ui/Input.tsx.
 */
export const Input = React.forwardRef(function Input(
  { label, error, hint, style = {}, ...props },
  ref
) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
        style={{
          background: "var(--surface-input)",
          border: `1px solid ${error ? "var(--attention)" : focus ? "var(--accent)" : "var(--border-hairline)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          color: "var(--text-body)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          outline: "none",
          width: "100%",
          transition: "border-color var(--dur-fast)",
          ...style,
        }}
        {...props}
      />
      {hint && !error && (
        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: "12px", color: "var(--attention)" }}>{error}</span>
      )}
    </div>
  );
});
