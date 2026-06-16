import React from "react";

/**
 * Sovi mark — the "aperture": a square frame interlocked with a rotated
 * diamond around an emerald core (containment + ownership: your data, held).
 * Canonical 64×64 geometry from BRAND.md §5. Sky strokes, emerald core.
 *
 * `tile` renders the mark on the rounded navy app-icon tile; bare omits it for
 * inline use on dark surfaces. Min size 16px — never shrink below.
 */
export function SoviMark({
  size = 28,
  tile = true,
  ...rest
}: { size?: number; tile?: boolean } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Sovi mark"
      {...rest}
    >
      {tile && (
        <rect x="1" y="1" width="62" height="62" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      )}
      <path d="M32 12 L52 32 L32 52 L12 32 Z" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="18" y="18" width="28" height="28" rx="3" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="2.6" fill="#34d399" />
    </svg>
  );
}

/**
 * Wordmark lockup — mark + "Sovi" in Inter 700, tracking -0.02em.
 */
export function Logo({
  size = 28,
  tile = true,
  wordmark = true,
  wordmarkSize = 20,
  style,
}: {
  size?: number;
  tile?: boolean;
  wordmark?: boolean;
  wordmarkSize?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", ...style }}>
      <SoviMark size={size} tile={tile} />
      {wordmark && (
        <span
          style={{
            fontSize: `${wordmarkSize}px`,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-strong)",
            lineHeight: 1,
          }}
        >
          Sovi
        </span>
      )}
    </span>
  );
}
