import * as React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  /** Calm status semantics. @default "default" */
  variant?: "default" | "accent" | "positive" | "warning" | "muted";
  style?: React.CSSProperties;
}

/**
 * Small status pill — tinted fill with a low-opacity matching border.
 * "warning" is amber (attention, never alarm).
 */
export function Badge(props: BadgeProps): JSX.Element;
