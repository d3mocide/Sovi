import React from "react";

/**
 * Sovi Switch — quiet toggle. Sky track when on. For settings (TOTP, sync).
 */
export function Switch({ checked, onChange, disabled, label, style = {} }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <span
        onClick={() => !disabled && onChange?.(!checked)}
        style={{
          width: "40px",
          height: "24px",
          borderRadius: "var(--radius-pill)",
          background: checked ? "var(--accent)" : "var(--border-strong)",
          position: "relative",
          transition: "background var(--dur-fast) var(--ease-standard)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "19px" : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: checked ? "var(--text-on-accent)" : "var(--navy-200)",
            transition: "left var(--dur-fast) var(--ease-out)",
          }}
        />
      </span>
      {label && (
        <span style={{ fontSize: "14px", color: "var(--text-body)", fontFamily: "var(--font-sans)" }}>
          {label}
        </span>
      )}
    </label>
  );
}
