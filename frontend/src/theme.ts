export const theme = {
  colors: {
    bg: "#0f172a",           // deep navy
    surface: "#1e293b",      // card surface
    surfaceHover: "#263348",
    border: "#334155",
    text: "#e2e8f0",         // primary text
    textMuted: "#94a3b8",    // secondary text
    accent: "#38bdf8",       // calm sky blue — primary action
    accentDim: "#0ea5e9",
    positive: "#34d399",     // green — forward progress
    warning: "#fbbf24",      // amber — attention (not alarm)
    // NO alarm red for debt — debt is forward progress
  },
  fonts: {
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  radius: { sm: "6px", md: "12px", lg: "20px" },
  shadow: { card: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)" },
};
