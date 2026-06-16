import React, { useState } from "react";
import { theme } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Sovi Card — the universal surface. Navy fill, 1px hairline border, 12px
 * radius, quiet shadow. Depth comes from contrast + the hairline, not heavy
 * shadow. Interactive cards lift to the hover surface on pointer-over.
 */
export function Card({ children, style, onClick }: CardProps) {
  const [hover, setHover] = useState(false);
  const interactive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: interactive && hover ? theme.colors.surfaceHover : theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: "20px",
        boxShadow: theme.shadow.card,
        cursor: interactive ? "pointer" : undefined,
        transition: interactive
          ? `background ${theme.motion.durFast} ${theme.motion.easeStandard}`
          : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
