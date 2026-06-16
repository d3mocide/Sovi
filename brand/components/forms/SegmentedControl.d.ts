import * as React from "react";

export type SegmentOption = string | { value: string; label: React.ReactNode };

export interface SegmentedControlProps {
  options: SegmentOption[];
  /** Currently selected value. */
  value: string;
  onChange?: (value: string) => void;
  /** @default "md" */
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

/**
 * Pill-button group for mutually-exclusive choices (the simulator's
 * Avalanche / Snowball / Side-by-side toggle). Active segment = sky tint.
 */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
