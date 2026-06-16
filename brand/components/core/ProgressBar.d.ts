import * as React from "react";

export interface ProgressBarProps {
  /** Percent filled, 0–100 (clamped). */
  value: number;
  /** Fill color. @default "var(--positive)" (emerald) */
  color?: string;
  /** Track height in px. @default 6 */
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Slim rounded progress track. Defaults to emerald — in Sovi a filling bar
 * means progress *paid off*, not danger.
 */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
