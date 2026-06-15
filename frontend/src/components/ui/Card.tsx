import React from "react";
import { theme } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: "20px",
        boxShadow: theme.shadow.card,
        cursor: onClick ? "pointer" : undefined,
        transition: onClick ? "background 0.15s" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
