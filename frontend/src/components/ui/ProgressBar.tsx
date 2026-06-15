import React from "react";
import { theme } from "../../theme";

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  style?: React.CSSProperties;
}

export function ProgressBar({
  value,
  color = theme.colors.accent,
  height = 6,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        background: theme.colors.border,
        borderRadius: "999px",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: color,
          borderRadius: "999px",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}
