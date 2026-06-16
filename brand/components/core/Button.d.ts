import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Shows "Loading…" and disables the button. */
  loading?: boolean;
  /** Optional leading icon node (e.g. a Lucide <svg>). */
  iconLeft?: React.ReactNode;
  /** Optional trailing icon node. */
  iconRight?: React.ReactNode;
}

/**
 * Sovi's action button. Sky primary with dark text reads as the single
 * confident action; secondary/ghost recede; "danger" is amber, never red.
 *
 * @startingPoint section="Core" subtitle="Primary, secondary, ghost & danger actions" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
