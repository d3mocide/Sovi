import * as React from "react";

export interface StatBlockProps {
  /** Uppercase eyebrow caption. */
  label: string;
  /** The figure — string or number, rendered in tabular mono. */
  value: React.ReactNode;
  /** Optional trailing unit ("months", "%"). */
  unit?: string;
  /** Optional sub-caption below the figure. */
  caption?: string;
  /** @default "accent" */
  tone?: "accent" | "positive" | "neutral" | "attention";
  /** @default "lg" */
  size?: "sm" | "md" | "lg" | "xl";
  /** @default "left" */
  align?: "left" | "center";
  style?: React.CSSProperties;
}

/**
 * The signature Sovi stat: uppercase eyebrow + big tabular-mono numeral +
 * optional unit and caption. Drop it inside a Card.
 *
 * @startingPoint section="Data" subtitle="Eyebrow + big mono numeral figure" viewport="700x220"
 */
export function StatBlock(props: StatBlockProps): JSX.Element;
