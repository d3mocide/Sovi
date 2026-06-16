import React from "react";

/**
 * Sovi Select — native select styled to match Input. Sunken deep fill.
 */
export const Select = React.forwardRef(function Select(
  { label, error, children, style = {}, ...props },
  ref
) {
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
      <div style={{ position: "relative", display: "flex" }}>
        <select
          ref={ref}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            background: "var(--surface-input-deep)",
            border: `1px solid ${error ? "var(--attention)" : "var(--border-hairline)"}`,
            borderRadius: "var(--radius-sm)",
            padding: "10px 36px 10px 14px",
            color: "var(--text-body)",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            outline: "none",
            width: "100%",
            cursor: "pointer",
            ...style,
          }}
          {...props}
        >
          {children}
        </select>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
});
