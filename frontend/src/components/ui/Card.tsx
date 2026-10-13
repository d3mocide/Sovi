import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

/**
 * Sovi Card — the universal surface: frosted glass (translucent fill, backdrop blur, hairline
 * border with a brighter top edge). Styles live in styles/layout.css (`.glass`).
 */
export function Card({ children, style, className, onClick }: CardProps) {
  const cls = ["glass", onClick ? "is-interactive" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <div onClick={onClick} className={cls} style={{ padding: "20px", ...style }}>
      {children}
    </div>
  );
}
