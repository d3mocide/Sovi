import React from "react";
import { Card } from "./Card";

/** A glass card with the accent-bar title used across the app (see `.panel-title`). */
export function Panel({
  title,
  aside,
  children,
  className,
  style,
}: {
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Card className={className} style={style}>
      {(title || aside) && (
        <div className="panel-title">
          <h2>{title}</h2>
          {aside && <span className="aside">{aside}</span>}
        </div>
      )}
      {children}
    </Card>
  );
}
