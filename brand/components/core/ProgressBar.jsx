import React from "react";

/**
 * Sovi ProgressBar — calm fill, rounded track. Defaults to emerald (forward
 * progress / "paid"); pass color for sky or amber. Mirrors
 * frontend/src/components/ui/ProgressBar.tsx but defaults to positive.
 */
export function ProgressBar({ value, color = "var(--positive)", height = 6, style = {} }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        background: "var(--border-hairline)",
        borderRadius: "var(--radius-pill)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: color,
          borderRadius: "var(--radius-pill)",
          transition: "width var(--dur-slow) var(--ease-out)",
        }}
      />
    </div>
  );
}
