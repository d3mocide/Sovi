import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** When set, the card is clickable and lifts to the hover surface. */
  onClick?: () => void;
  /** Force the interactive hover treatment without an onClick handler. */
  interactive?: boolean;
  style?: React.CSSProperties;
}

/**
 * The universal Sovi surface: 12px radius, hairline border, quiet shadow.
 * Everything in the product lives on a Card.
 *
 * @startingPoint section="Core" subtitle="The universal content surface" viewport="700x160"
 */
export function Card(props: CardProps): JSX.Element;
