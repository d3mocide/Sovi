import React from "react";

/**
 * Sovi SegmentedControl — the strategy toggle (Avalanche / Snowball /
 * Side-by-side). Selected segment gets sky tint + sky border + sky text.
 * Mirrors the inline toggle in SimulatorPage.tsx.
 */
export function SegmentedControl({ options, value, onChange, size = "md", style = {} }) {
  const pad = size === "sm" ? "6px 12px" : "7px 16px";
  const fs = size === "sm" ? "12px" : "13px";
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", ...style }}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={val}
            onClick={() => onChange?.(val)}
            style={{
              padding: pad,
              fontSize: fs,
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border-hairline)"}`,
              background: active ? "var(--accent-tint)" : "transparent",
              color: active ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all var(--dur-fast) var(--ease-standard)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
