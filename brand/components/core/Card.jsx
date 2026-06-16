import React from "react";

/**
 * Sovi Card — the universal surface. Quiet cool-toned shadow, hairline
 * border, 12px radius. Becomes interactive (hover surface shift) when onClick
 * is passed. Mirrors frontend/src/components/ui/Card.tsx.
 */
export function Card({ children, onClick, interactive, style = {}, ...props }) {
  const [hover, setHover] = React.useState(false);
  const clickable = !!onClick || interactive;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: clickable && hover ? "var(--surface-card-hover)" : "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
        boxShadow: "var(--shadow-card)",
        cursor: clickable ? "pointer" : undefined,
        transition: "background var(--dur-fast) var(--ease-standard)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
