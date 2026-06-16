/**
 * Sovi theme — a thin, typed bridge to the canonical CSS design tokens.
 *
 * The single source of truth at runtime is `styles/tokens/*.css` (semantic
 * aliases like `--accent`, `--surface-card`). Every value here resolves to a
 * `var(--…)` so product code never drifts from the brand tokens. Always prefer
 * these semantic names over raw hex.
 */
export const theme = {
  colors: {
    bg: "var(--bg-app)",
    void: "var(--bg-void)",
    raised: "var(--bg-raised)",
    surface: "var(--surface-card)",
    surfaceHover: "var(--surface-card-hover)",
    inputFill: "var(--surface-input)",
    inputDeep: "var(--surface-input-deep)",
    overlay: "var(--surface-overlay)",
    border: "var(--border-hairline)",
    borderStrong: "var(--border-strong)",
    text: "var(--text-strong)",
    textSecondary: "var(--text-secondary)",
    textMuted: "var(--text-muted)",
    textFaint: "var(--text-faint)",
    onAccent: "var(--text-on-accent)",
    accent: "var(--accent)",
    accentDim: "var(--accent-strong)",
    accentTint: "var(--accent-tint)",
    accentTintBorder: "var(--accent-tint-border)",
    positive: "var(--positive)",
    positiveTint: "var(--positive-tint)",
    positiveTintBorder: "var(--positive-tint-border)",
    // Amber attention — the strongest signal Sovi allows. NO alarm red.
    warning: "var(--attention)",
    warningTint: "var(--attention-tint)",
    warningTintBorder: "var(--attention-tint-border)",
    violet: "var(--data-4)",
  },
  fonts: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
  },
  radius: {
    xs: "var(--radius-xs)",
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    pill: "var(--radius-pill)",
  },
  shadow: {
    card: "var(--shadow-card)",
    pop: "var(--shadow-pop)",
    modal: "var(--shadow-modal)",
    focus: "var(--shadow-focus)",
  },
  motion: {
    easeStandard: "var(--ease-standard)",
    easeOut: "var(--ease-out)",
    durFast: "var(--dur-fast)",
    durBase: "var(--dur-base)",
    durSlow: "var(--dur-slow)",
  },
} as const;
