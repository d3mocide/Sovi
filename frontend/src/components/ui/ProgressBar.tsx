import React from "react";
import { theme } from "../../theme";

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Sovi ProgressBar — emerald by default (forward progress). Pill track on the
 * hairline, calm fill animation, no bounce.
 */
export function ProgressBar({
  value,
  color = theme.colors.positive,
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
        borderRadius: theme.radius.pill,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: color,
          borderRadius: theme.radius.pill,
          transition: `width ${theme.motion.durSlow} ${theme.motion.easeOut}`,
        }}
      />
    </div>
  );
}
