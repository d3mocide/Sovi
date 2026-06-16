/* @ds-bundle: {"format":3,"namespace":"SoviDesignSystem_6076be","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"DebtRow","sourcePath":"components/data/DebtRow.jsx"},{"name":"StatBlock","sourcePath":"components/data/StatBlock.jsx"},{"name":"StreakChip","sourcePath":"components/data/StreakChip.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"b80956d0584d","components/core/Button.jsx":"d25a147e1968","components/core/Card.jsx":"9449bef2b245","components/core/ProgressBar.jsx":"5b569d48ab59","components/data/DebtRow.jsx":"dfbcd3ec442d","components/data/StatBlock.jsx":"babf4e8ee5df","components/data/StreakChip.jsx":"60d98822f8cd","components/forms/Input.jsx":"10caeb47dd5b","components/forms/SegmentedControl.jsx":"e9ff2063f491","components/forms/Select.jsx":"b2ad4405e5cc","components/forms/Switch.jsx":"1faeec9f2aee","ui_kits/Icons.jsx":"fb204bc4c0dc","ui_kits/desktop/AccountsScreen.jsx":"7274498ef454","ui_kits/desktop/AreaChart.jsx":"5a42d341307d","ui_kits/desktop/DashboardScreen.jsx":"0b30644fc4f5","ui_kits/desktop/Shell.jsx":"28ed8d1ea853","ui_kits/desktop/SimulatorScreen.jsx":"b4a4b2a5fd49","ui_kits/desktop/data.js":"7265779e8fe1","ui_kits/mobile/MobileApp.jsx":"a05b362e982c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SoviDesignSystem_6076be = window.SoviDesignSystem_6076be || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sovi Badge — small status pill. Tinted fill + matching border at low
 * opacity. Calm semantics: accent / positive / attention (amber) / muted.
 * Mirrors frontend/src/components/ui/Badge.tsx.
 */
function Badge({
  children,
  variant = "default",
  style = {},
  ...props
}) {
  const variants = {
    default: {
      background: "var(--border-hairline)",
      color: "var(--text-body)"
    },
    accent: {
      background: "var(--accent-tint)",
      color: "var(--accent)",
      border: "1px solid var(--accent-tint-border)"
    },
    positive: {
      background: "var(--positive-tint)",
      color: "var(--positive)",
      border: "1px solid var(--emerald-glow-strong)"
    },
    warning: {
      background: "var(--attention-tint)",
      color: "var(--attention)",
      border: "1px solid var(--amber-glow-strong)"
    },
    muted: {
      background: "rgba(148,163,184,0.1)",
      color: "var(--text-muted)"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      borderRadius: "var(--radius-pill)",
      fontSize: "12px",
      fontWeight: 500,
      fontFamily: "var(--font-sans)",
      ...variants[variant],
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sovi Button — primary action primitive.
 * Faithful to frontend/src/components/ui/Button.tsx: sky primary with dark
 * text, bordered secondary, quiet ghost, and an amber "danger" (never red).
 */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft = null,
  iconRight = null,
  children,
  disabled,
  style = {},
  ...props
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "background var(--dur-fast) var(--ease-standard), opacity var(--dur-fast)",
    border: "1px solid transparent",
    outline: "none",
    whiteSpace: "nowrap"
  };
  const sizes = {
    sm: {
      padding: "6px 12px",
      fontSize: "13px"
    },
    md: {
      padding: "10px 20px",
      fontSize: "14px"
    },
    lg: {
      padding: "14px 28px",
      fontSize: "16px"
    }
  };
  const variants = {
    primary: {
      background: "var(--accent)",
      color: "var(--text-on-accent)"
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-body)",
      borderColor: "var(--border-hairline)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-muted)"
    },
    danger: {
      background: "var(--attention-tint)",
      color: "var(--attention)",
      borderColor: "var(--attention)"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled || loading,
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      ...style
    }
  }, props), loading ? "Loading…" : /*#__PURE__*/React.createElement(React.Fragment, null, iconLeft, children, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sovi Card — the universal surface. Quiet cool-toned shadow, hairline
 * border, 12px radius. Becomes interactive (hover surface shift) when onClick
 * is passed. Mirrors frontend/src/components/ui/Card.tsx.
 */
function Card({
  children,
  onClick,
  interactive,
  style = {},
  ...props
}) {
  const [hover, setHover] = React.useState(false);
  const clickable = !!onClick || interactive;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: clickable && hover ? "var(--surface-card-hover)" : "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      padding: "20px",
      boxShadow: "var(--shadow-card)",
      cursor: clickable ? "pointer" : undefined,
      transition: "background var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
/**
 * Sovi ProgressBar — calm fill, rounded track. Defaults to emerald (forward
 * progress / "paid"); pass color for sky or amber. Mirrors
 * frontend/src/components/ui/ProgressBar.tsx but defaults to positive.
 */
function ProgressBar({
  value,
  color = "var(--positive)",
  height = 6,
  style = {}
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: `${height}px`,
      background: "var(--border-hairline)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${clamped}%`,
      height: "100%",
      background: color,
      borderRadius: "var(--radius-pill)",
      transition: "width var(--dur-slow) var(--ease-out)"
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/DebtRow.jsx
try { (() => {
/**
 * Sovi DebtRow — a single debt's payoff card: name + APR on the left, balance
 * + "% paid" on the right, emerald progress bar, optional payoff estimate.
 * Mirrors DebtProgressList.tsx item.
 */
function DebtRow({
  name,
  apr,
  balance,
  progressPct,
  payoffMonths,
  onClick,
  style = {}
}) {
  const fmt = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    onClick: onClick,
    style: {
      padding: "16px 20px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "10px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 600,
      fontSize: "15px",
      color: "var(--text-strong)"
    }
  }, name), apr != null && /*#__PURE__*/React.createElement("p", {
    className: "sovi-numeral",
    style: {
      fontSize: "12px",
      color: "var(--text-muted)",
      marginTop: "2px"
    }
  }, apr, "% APR")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "sovi-numeral",
    style: {
      fontWeight: 600,
      fontSize: "15px",
      color: "var(--text-strong)"
    }
  }, fmt(balance)), progressPct != null && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "12px",
      color: "var(--positive)",
      marginTop: "2px"
    }
  }, Math.round(progressPct), "% paid"))), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: progressPct ?? 0,
    color: "var(--positive)"
  }), payoffMonths != null && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "12px",
      color: "var(--text-muted)",
      marginTop: "8px"
    }
  }, "Payoff in ~", payoffMonths, " months"));
}
Object.assign(__ds_scope, { DebtRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DebtRow.jsx", error: String((e && e.message) || e) }); }

// components/data/StatBlock.jsx
try { (() => {
/**
 * Sovi StatBlock — the recurring "eyebrow + big mono numeral" pattern used
 * across the dashboard (Interest saved, Debt-free countdown, Total interest).
 * Numerals are mono + tabular so figures align and read as data.
 */
function StatBlock({
  label,
  value,
  unit,
  caption,
  tone = "accent",
  size = "lg",
  align = "left",
  style = {}
}) {
  const toneColor = {
    accent: "var(--accent)",
    positive: "var(--positive)",
    neutral: "var(--text-strong)",
    attention: "var(--attention)"
  }[tone];
  const valueSize = {
    sm: "20px",
    md: "32px",
    lg: "48px",
    xl: "56px"
  }[size];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      ...style
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "sovi-eyebrow",
    style: {
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      fontSize: "12px",
      fontWeight: 600,
      marginBottom: "10px"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "8px",
      justifyContent: align === "center" ? "center" : "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: valueSize,
      lineHeight: 1,
      letterSpacing: "var(--tracking-tight)",
      fontVariantNumeric: "tabular-nums",
      color: toneColor
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "20px",
      color: "var(--text-muted)",
      fontWeight: 500
    }
  }, unit)), caption && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)",
      fontSize: "14px",
      marginTop: "8px"
    }
  }, caption));
}
Object.assign(__ds_scope, { StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatBlock.jsx", error: String((e && e.message) || e) }); }

// components/data/StreakChip.jsx
try { (() => {
/**
 * Sovi StreakChip — a gamification badge. Big mono count + label + optional
 * "Best: N". Count goes emerald when active, muted at zero. Mirrors
 * StreakBadges.tsx. Calm reward, never guilt.
 */
function StreakChip({
  count,
  label,
  best,
  style = {}
}) {
  const active = count > 0;
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    style: {
      padding: "14px 18px",
      minWidth: "120px",
      flexShrink: 0,
      textAlign: "center",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "28px",
      fontWeight: 700,
      color: active ? "var(--positive)" : "var(--text-muted)",
      lineHeight: 1,
      marginBottom: "6px",
      fontVariantNumeric: "tabular-nums"
    }
  }, count), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "11px",
      color: "var(--text-muted)",
      fontWeight: 500
    }
  }, label), best > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "10px",
      color: "var(--text-muted)",
      opacity: 0.6,
      marginTop: "4px"
    }
  }, "Best: ", best));
}
Object.assign(__ds_scope, { StreakChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StreakChip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sovi Input — labelled field with a sunken cool fill. Amber border on error
 * (never red). Mirrors frontend/src/components/ui/Input.tsx.
 */
const Input = React.forwardRef(function Input({
  label,
  error,
  hint,
  style = {},
  ...props
}, ref) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: "13px",
      fontWeight: 500,
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-wide)"
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    ref: ref,
    onFocus: e => {
      setFocus(true);
      props.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      props.onBlur?.(e);
    },
    style: {
      background: "var(--surface-input)",
      border: `1px solid ${error ? "var(--attention)" : focus ? "var(--accent)" : "var(--border-hairline)"}`,
      borderRadius: "var(--radius-sm)",
      padding: "10px 14px",
      color: "var(--text-body)",
      fontFamily: "var(--font-sans)",
      fontSize: "14px",
      outline: "none",
      width: "100%",
      transition: "border-color var(--dur-fast)",
      ...style
    }
  }, props)), hint && !error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "12px",
      color: "var(--text-faint)"
    }
  }, hint), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "12px",
      color: "var(--attention)"
    }
  }, error));
});
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
/**
 * Sovi SegmentedControl — the strategy toggle (Avalanche / Snowball /
 * Side-by-side). Selected segment gets sky tint + sky border + sky text.
 * Mirrors the inline toggle in SimulatorPage.tsx.
 */
function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  style = {}
}) {
  const pad = size === "sm" ? "6px 12px" : "7px 16px";
  const fs = size === "sm" ? "12px" : "13px";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      ...style
    }
  }, options.map(opt => {
    const val = typeof opt === "string" ? opt : opt.value;
    const label = typeof opt === "string" ? opt : opt.label;
    const active = val === value;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      onClick: () => onChange?.(val),
      style: {
        padding: pad,
        fontSize: fs,
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border-hairline)"}`,
        background: active ? "var(--accent-tint)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        cursor: "pointer",
        transition: "all var(--dur-fast) var(--ease-standard)"
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sovi Select — native select styled to match Input. Sunken deep fill.
 */
const Select = React.forwardRef(function Select({
  label,
  error,
  children,
  style = {},
  ...props
}, ref) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: "13px",
      fontWeight: 500,
      color: "var(--text-muted)",
      letterSpacing: "var(--tracking-wide)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    ref: ref,
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      background: "var(--surface-input-deep)",
      border: `1px solid ${error ? "var(--attention)" : "var(--border-hairline)"}`,
      borderRadius: "var(--radius-sm)",
      padding: "10px 36px 10px 14px",
      color: "var(--text-body)",
      fontFamily: "var(--font-sans)",
      fontSize: "14px",
      outline: "none",
      width: "100%",
      cursor: "pointer",
      ...style
    }
  }, props), children), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-muted)",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))));
});
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * Sovi Switch — quiet toggle. Sky track when on. For settings (TOTP, sync).
 */
function Switch({
  checked,
  onChange,
  disabled,
  label,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange?.(!checked),
    style: {
      width: "40px",
      height: "24px",
      borderRadius: "var(--radius-pill)",
      background: checked ? "var(--accent)" : "var(--border-strong)",
      position: "relative",
      transition: "background var(--dur-fast) var(--ease-standard)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "3px",
      left: checked ? "19px" : "3px",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      background: checked ? "var(--text-on-accent)" : "var(--navy-200)",
      transition: "left var(--dur-fast) var(--ease-out)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "14px",
      color: "var(--text-body)",
      fontFamily: "var(--font-sans)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/Icons.jsx
try { (() => {
/* Sovi icon set — Lucide-derived (2px stroke, 24px grid, currentColor).
   The Sovi codebase shipped only unicode glyphs (✓ ↻ →); this upgrades the
   set to Lucide for the reimagined desktop/mobile kits. Loaded first, exports
   to window so every text/babel screen can use the same <Icon> components. */
(function () {
  const S = ({
    d,
    children,
    size = 18,
    stroke = 2,
    ...rest
  }) => React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...rest
  }, children || React.createElement("path", {
    d
  }));
  const paths = {
    dashboard: "M3 12h7V3H3v9Zm0 9h7v-6H3v6Zm11 0h7V12h-7v9Zm0-18v6h7V3h-7Z",
    wallet: "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5 M16 12h.01",
    sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
    settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z",
    refresh: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16 M8 16H3v5",
    shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z",
    plus: "M5 12h14 M12 5v14",
    check: "M20 6 9 17l-5-5",
    trendingDown: "M16 17h6v-6 M22 17l-8.5-8.5-5 5L2 7",
    server: "M5 2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M5 14h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z M6 6h.01 M6 18h.01",
    lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 10 0v4",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
    bell: "M10.27 21a2 2 0 0 0 3.46 0 M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    arrowUpRight: "M7 7h10v10 M7 17 17 7",
    calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    creditCard: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M2 10h20",
    chevronRight: "M9 18l6-6-6-6",
    home: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
  };
  const Icon = ({
    name,
    ...rest
  }) => S({
    d: paths[name] || "",
    ...rest
  });
  window.SoviIcons = {
    Icon,
    paths
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/AccountsScreen.jsx
try { (() => {
/* Desktop Accounts — manage connected & manual accounts; classify debts. */
(function () {
  const {
    Card,
    Badge,
    Button
  } = window.SoviDesignSystem_6076be;
  const {
    Icon
  } = window.SoviIcons;
  const fmt = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(n);
  const TYPE_LABEL = {
    checking: "Checking",
    savings: "Savings",
    credit_card: "Credit Card",
    loan: "Loan",
    investment: "Investment",
    other: "Other"
  };
  const TYPE_ICON = {
    checking: "wallet",
    savings: "wallet",
    credit_card: "creditCard",
    loan: "creditCard",
    investment: "arrowUpRight",
    other: "wallet"
  };
  function AccountRow({
    a,
    onOpen
  }) {
    const [hover, setHover] = React.useState(false);
    const neg = a.balance < 0;
    return /*#__PURE__*/React.createElement("div", {
      onClick: () => onOpen(a),
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        display: "grid",
        gridTemplateColumns: "40px 1fr auto auto",
        alignItems: "center",
        gap: "16px",
        padding: "14px 18px",
        cursor: "pointer",
        background: hover ? "var(--surface-card-hover)" : "transparent",
        borderBottom: "1px solid var(--border-hairline)",
        transition: "background var(--dur-fast)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-input)",
        display: "grid",
        placeItems: "center",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: TYPE_ICON[a.type],
      size: 18
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "15px",
        fontWeight: 600,
        color: "var(--text-strong)"
      }
    }, a.name), a.needsClass && /*#__PURE__*/React.createElement(Badge, {
      variant: "warning"
    }, "Needs classification"), a.hasDebt && /*#__PURE__*/React.createElement(Badge, {
      variant: "muted"
    }, a.apr, "% APR")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "3px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      variant: "muted"
    }, TYPE_LABEL[a.type]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "12px",
        color: "var(--text-faint)"
      }
    }, a.isManual ? "Manual" : "SimpleFIN"))), /*#__PURE__*/React.createElement("span", {
      className: "sovi-numeral",
      style: {
        fontSize: "15px",
        fontWeight: 600,
        color: neg ? "var(--text-strong)" : "var(--positive)"
      }
    }, fmt(a.balance)), /*#__PURE__*/React.createElement(Icon, {
      name: "chevronRight",
      size: 18,
      style: {
        color: "var(--text-faint)"
      }
    }));
  }
  function AccountsScreen({
    onOpen
  }) {
    const d = window.SoviData;
    const needs = d.accounts.filter(a => a.needsClass).length;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 600,
        color: "var(--text-strong)"
      }
    }, "Accounts"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "4px 0 0",
        fontSize: "13px",
        color: "var(--text-muted)"
      }
    }, d.accounts.length, " accounts", needs > 0 ? ` — ${needs} need classification` : "")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: "10px"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "refresh",
        size: 14
      })
    }, "Sync now"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 14
      })
    }, "Add manual"))), /*#__PURE__*/React.createElement(Card, {
      style: {
        padding: 0,
        overflow: "hidden"
      }
    }, d.accounts.map(a => /*#__PURE__*/React.createElement(AccountRow, {
      key: a.id,
      a: a,
      onOpen: onOpen
    }))));
  }
  window.SoviAccountsScreen = AccountsScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/AccountsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/AreaChart.jsx
try { (() => {
/* Sovi AreaChart — lightweight SVG area/line built from data points.
   Replaces recharts (not bundled here). Calm: sky line, soft tint fill,
   no axes clutter. Exports to window for the babel screens. */
(function () {
  function AreaChart({
    data,
    height = 180,
    color = "var(--accent)",
    id = "g",
    labels = []
  }) {
    const w = 1000; // viewBox width, scales to container
    const h = height;
    const pad = 8;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = (w - pad * 2) / (data.length - 1);
    const pts = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      return [x, y];
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L${pts[0][0].toFixed(1)} ${h - pad} Z`;
    const last = pts[pts.length - 1];
    return React.createElement("svg", {
      viewBox: `0 0 ${w} ${h}`,
      width: "100%",
      height: h,
      preserveAspectRatio: "none",
      style: {
        display: "block",
        overflow: "visible"
      }
    }, React.createElement("defs", null, React.createElement("linearGradient", {
      id,
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    }, React.createElement("stop", {
      offset: "0%",
      stopColor: "#38bdf8",
      stopOpacity: 0.28
    }), React.createElement("stop", {
      offset: "100%",
      stopColor: "#38bdf8",
      stopOpacity: 0
    }))), React.createElement("path", {
      d: area,
      fill: `url(#${id})`
    }), React.createElement("path", {
      d: line,
      fill: "none",
      stroke: color,
      strokeWidth: 2.5,
      strokeLinejoin: "round",
      vectorEffect: "non-scaling-stroke"
    }), React.createElement("circle", {
      cx: last[0],
      cy: last[1],
      r: 4,
      fill: "#34d399"
    }));
  }
  window.SoviAreaChart = AreaChart;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/AreaChart.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/DashboardScreen.jsx
try { (() => {
/* Desktop Dashboard — the at-a-glance "intense work" overview. */
(function () {
  const {
    Card,
    StatBlock,
    DebtRow,
    StreakChip,
    Button,
    Badge
  } = window.SoviDesignSystem_6076be;
  const {
    Icon
  } = window.SoviIcons;
  const AreaChart = window.SoviAreaChart;
  const fmt = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
  function DashboardScreen() {
    const d = window.SoviData;
    const s = d.summary;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      style: {
        background: "linear-gradient(160deg, var(--surface-card), var(--bg-raised))"
      }
    }, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Debt-free in",
      value: s.debtFreeMonths,
      unit: "months",
      caption: `${s.debtFreeDate} · ${fmt(s.totalDebt)} remaining`,
      size: "xl",
      tone: "accent"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Interest saved",
      value: fmt(s.interestSaved),
      tone: "positive",
      size: "md"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Paid this year",
      value: fmt(s.paidThisYear),
      tone: "neutral",
      size: "md"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "On-time streak",
      value: s.onTimeStreak,
      unit: "mo",
      tone: "positive",
      size: "md"
    }), /*#__PURE__*/React.createElement(Badge, {
      variant: "positive",
      style: {
        marginTop: "12px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 12
    }), " Best yet"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: "16px",
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: 0,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Total debt \xB7 90-day trend"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        color: "var(--positive)",
        fontSize: "13px",
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trendingDown",
      size: 15
    }), " \u221235%")), /*#__PURE__*/React.createElement(AreaChart, {
      data: d.trend,
      height: 200,
      id: "dashTrend"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "10px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement("span", null, "Mar"), /*#__PURE__*/React.createElement("span", null, "Apr"), /*#__PURE__*/React.createElement("span", null, "May"), /*#__PURE__*/React.createElement("span", null, "Jun"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: 0,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Debt progress"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 14
      })
    }, "Add")), d.debts.map(debt => /*#__PURE__*/React.createElement(DebtRow, {
      key: debt.id,
      name: debt.name,
      apr: debt.apr,
      balance: debt.balance,
      progressPct: debt.progressPct,
      payoffMonths: debt.payoffMonths
    })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: "0 0 12px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Streaks"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: "12px"
      }
    }, d.streaks.map(st => /*#__PURE__*/React.createElement(StreakChip, {
      key: st.type,
      count: st.count,
      label: st.type,
      best: st.best
    })), /*#__PURE__*/React.createElement(Card, {
      style: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 20
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "13px"
      }
    }, "All data stays on ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: "var(--text-secondary)"
      }
    }, d.host.name), ". Nothing leaves your network.")))));
  }
  window.SoviDashboardScreen = DashboardScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/Shell.jsx
try { (() => {
/* Desktop workspace chrome: left sidebar + top bar. */
(function () {
  const {
    Icon
  } = window.SoviIcons;
  const {
    Badge
  } = window.SoviDesignSystem_6076be;
  const NAV = [{
    key: "dashboard",
    label: "Dashboard",
    icon: "dashboard"
  }, {
    key: "accounts",
    label: "Accounts",
    icon: "wallet"
  }, {
    key: "simulator",
    label: "Simulator",
    icon: "sliders"
  }];
  function NavItem({
    item,
    active,
    onClick
  }) {
    const [hover, setHover] = React.useState(false);
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        width: "100%",
        padding: "9px 12px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: "14px",
        fontWeight: 500,
        textAlign: "left",
        color: active ? "var(--accent)" : hover ? "var(--text-body)" : "var(--text-muted)",
        background: active ? "var(--accent-tint)" : hover ? "var(--surface-card)" : "transparent",
        transition: "all var(--dur-fast) var(--ease-standard)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      size: 18
    }), item.label);
  }
  function Sidebar({
    active,
    onNav
  }) {
    const d = window.SoviData;
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: "var(--sidebar-w)",
        flexShrink: 0,
        background: "var(--bg-void)",
        borderRight: "1px solid var(--border-hairline)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
        boxSizing: "border-box",
        height: "100vh",
        position: "sticky",
        top: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "4px 8px 22px"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/sovi-mark.svg",
      width: "32",
      height: "32",
      alt: ""
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "var(--text-strong)"
      }
    }, "Sovi")), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "3px"
      }
    }, NAV.map(i => /*#__PURE__*/React.createElement(NavItem, {
      key: i.key,
      item: i,
      active: active === i.key,
      onClick: () => onNav(i.key)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(NavItem, {
      item: {
        label: "Settings",
        icon: "settings"
      },
      active: active === "settings",
      onClick: () => onNav("settings")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "12px",
        padding: "12px",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "var(--positive)",
        marginBottom: "6px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "server",
      size: 15
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "12px",
        fontWeight: 600
      }
    }, "Self-hosted")), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: "11px",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)"
      }
    }, d.host.name), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "2px 0 0",
        fontSize: "11px",
        color: "var(--text-faint)"
      }
    }, "Synced ", d.host.synced)));
  }
  function Topbar({
    title,
    onRefresh,
    refreshing
  }) {
    const d = window.SoviData;
    return /*#__PURE__*/React.createElement("header", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: "64px",
        flexShrink: 0,
        borderBottom: "1px solid var(--border-hairline)",
        position: "sticky",
        top: 0,
        background: "color-mix(in srgb, var(--bg-app) 88%, transparent)",
        backdropFilter: "var(--blur-overlay)",
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "var(--text-strong)"
      }
    }, title), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 12px",
        background: "var(--surface-input)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-faint)",
        fontSize: "13px",
        width: "200px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 15
    }), /*#__PURE__*/React.createElement("span", null, "Search\u2026")), /*#__PURE__*/React.createElement("button", {
      onClick: onRefresh,
      title: "Refresh data",
      style: {
        display: "grid",
        placeItems: "center",
        width: "38px",
        height: "38px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-hairline)",
        background: "var(--surface-card)",
        color: "var(--text-muted)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 17,
      style: {
        animation: refreshing ? "sovi-spin 0.9s linear infinite" : "none"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "var(--accent-tint)",
        border: "1px solid var(--accent-tint-border)",
        display: "grid",
        placeItems: "center",
        color: "var(--accent)",
        fontWeight: 600,
        fontSize: "14px"
      }
    }, d.user.name[0])));
  }
  function Shell({
    active,
    onNav,
    title,
    onRefresh,
    refreshing,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-app)"
      }
    }, /*#__PURE__*/React.createElement(Sidebar, {
      active: active,
      onNav: onNav
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column"
      }
    }, /*#__PURE__*/React.createElement(Topbar, {
      title: title,
      onRefresh: onRefresh,
      refreshing: refreshing
    }), /*#__PURE__*/React.createElement("main", {
      style: {
        flex: 1,
        padding: "28px",
        maxWidth: "var(--desktop-max)",
        width: "100%",
        boxSizing: "border-box",
        margin: "0 auto"
      }
    }, children)));
  }
  window.SoviShell = {
    Shell,
    Sidebar,
    Topbar
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/SimulatorScreen.jsx
try { (() => {
/* Desktop Simulator — extra-payment slider, strategy toggle, payoff results. */
(function () {
  const {
    Card,
    StatBlock,
    SegmentedControl,
    Button,
    Badge
  } = window.SoviDesignSystem_6076be;
  const {
    Icon
  } = window.SoviIcons;
  const AreaChart = window.SoviAreaChart;
  const fmt = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);

  // Toy payoff model so the controls feel live.
  function project(extra, strategy) {
    const base = 14; // baseline months
    const accel = Math.min(8, Math.round(extra / 120));
    const months = Math.max(4, base - accel - (strategy === "avalanche" ? 1 : 0));
    const interest = Math.max(900, 3120 - extra * 1.4 - (strategy === "avalanche" ? 180 : 0));
    const monthsSaved = base - months;
    const interestSaved = 3120 - interest;
    // synth a descending trend for the chart
    const start = 18240;
    const trend = Array.from({
      length: months + 1
    }, (_, i) => Math.round(start * (1 - i / months)));
    return {
      months,
      interest,
      monthsSaved,
      interestSaved,
      trend
    };
  }
  function SimulatorScreen() {
    const [extra, setExtra] = React.useState(300);
    const [strategy, setStrategy] = React.useState("avalanche");
    const r = project(extra, strategy);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 600,
        color: "var(--text-strong)"
      }
    }, "Payoff simulator"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "4px 0 0",
        fontSize: "13px",
        color: "var(--text-muted)"
      }
    }, "Runs locally \u2014 drag to see the effect instantly.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1.4fr",
        gap: "16px",
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "22px"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: "14px"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: 0,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Extra monthly"), /*#__PURE__*/React.createElement("span", {
      className: "sovi-numeral",
      style: {
        fontSize: "22px",
        fontWeight: 700,
        color: "var(--accent)"
      }
    }, fmt(extra))), /*#__PURE__*/React.createElement("input", {
      type: "range",
      min: 0,
      max: 1500,
      step: 25,
      value: extra,
      onChange: e => setExtra(Number(e.target.value)),
      style: {
        width: "100%",
        accentColor: "var(--accent)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-faint)",
        marginTop: "6px"
      }
    }, /*#__PURE__*/React.createElement("span", null, "$0"), /*#__PURE__*/React.createElement("span", null, "$1,500"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: "0 0 12px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Strategy"), /*#__PURE__*/React.createElement(SegmentedControl, {
      value: strategy,
      onChange: setStrategy,
      options: [{
        value: "avalanche",
        label: "Avalanche"
      }, {
        value: "snowball",
        label: "Snowball"
      }]
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "12px 0 0",
        fontSize: "12px",
        color: "var(--text-faint)",
        lineHeight: 1.5
      }
    }, strategy === "avalanche" ? "Targets the highest APR first — least interest paid." : "Targets the smallest balance first — fastest wins for momentum.")), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 15
      })
    }, "Save scenario")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Debt-free date",
      value: r.months,
      unit: "mo",
      tone: "accent",
      size: "md"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Total interest",
      value: fmt(r.interest),
      tone: "neutral",
      size: "md"
    }))), /*#__PURE__*/React.createElement(Card, {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-sm)",
        background: "var(--positive-tint)",
        display: "grid",
        placeItems: "center",
        color: "var(--positive)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trendingDown",
      size: 20
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: "11px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Saved vs minimums only"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "4px 0 0",
        fontSize: "16px",
        fontWeight: 700,
        color: "var(--positive)"
      }
    }, r.monthsSaved, " months earlier \xB7 ", fmt(r.interestSaved), " less interest"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: "0 0 16px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Projected payoff"), /*#__PURE__*/React.createElement(AreaChart, {
      data: r.trend,
      height: 150,
      id: "simTrend"
    })))));
  }
  window.SoviSimulatorScreen = SimulatorScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/SimulatorScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/data.js
try { (() => {
/* Fake Sovi data for the UI kits — realistic, calm numbers. */
(function () {
  window.SoviData = {
    user: {
      email: "alex@home.lan",
      name: "Alex"
    },
    host: {
      name: "sovi.home.lan",
      synced: "2 min ago"
    },
    summary: {
      debtFreeMonths: 14,
      debtFreeDate: "March 2027",
      totalDebt: 18240,
      interestSaved: 1284,
      paidThisYear: 9120,
      onTimeStreak: 7
    },
    debts: [{
      id: "1",
      name: "Chase Sapphire",
      type: "credit_card",
      apr: 24.99,
      balance: 4820,
      progressPct: 38,
      payoffMonths: 11
    }, {
      id: "2",
      name: "Student Loan — Nelnet",
      type: "loan",
      apr: 5.5,
      balance: 9600,
      progressPct: 52,
      payoffMonths: 14
    }, {
      id: "3",
      name: "Auto Loan",
      type: "loan",
      apr: 6.9,
      balance: 3820,
      progressPct: 64,
      payoffMonths: 8
    }],
    accounts: [{
      id: "a1",
      name: "Everyday Checking",
      type: "checking",
      balance: 4210.55,
      isManual: false
    }, {
      id: "a2",
      name: "Emergency Savings",
      type: "savings",
      balance: 8600.0,
      isManual: false
    }, {
      id: "a3",
      name: "Chase Sapphire",
      type: "credit_card",
      balance: -4820.12,
      apr: 24.99,
      hasDebt: true
    }, {
      id: "a4",
      name: "Student Loan — Nelnet",
      type: "loan",
      balance: -9600.0,
      apr: 5.5,
      hasDebt: true
    }, {
      id: "a5",
      name: "Auto Loan",
      type: "loan",
      balance: -3820.0,
      apr: 6.9,
      hasDebt: true
    }, {
      id: "a6",
      name: "Brokerage",
      type: "investment",
      balance: 12450.3,
      isManual: true,
      needsClass: true
    }],
    // 90-day total-debt trend (descending = good)
    trend: [28100, 27600, 27200, 26500, 26100, 25400, 24950, 24300, 23800, 23100, 22600, 21950, 21400, 20800, 20150, 19600, 18900, 18240],
    streaks: [{
      type: "On-time payments",
      count: 7,
      best: 12
    }, {
      type: "Daily syncs",
      count: 3,
      best: 9
    }, {
      type: "No new debt",
      count: 18,
      best: 18
    }],
    transactions: [{
      id: "t1",
      merchant: "Nelnet Payment",
      date: "Jun 12",
      amount: -340,
      account: "Student Loan",
      kind: "payment"
    }, {
      id: "t2",
      merchant: "Chase Card Payment",
      date: "Jun 10",
      amount: -260,
      account: "Chase Sapphire",
      kind: "payment"
    }, {
      id: "t3",
      merchant: "Whole Foods",
      date: "Jun 9",
      amount: -82.4,
      account: "Checking",
      kind: "spend"
    }, {
      id: "t4",
      merchant: "Paycheck",
      date: "Jun 7",
      amount: 2480,
      account: "Checking",
      kind: "income"
    }, {
      id: "t5",
      merchant: "Auto Loan",
      date: "Jun 5",
      amount: -190,
      account: "Auto Loan",
      kind: "payment"
    }]
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/data.js", error: String((e && e.message) || e) }); }

// ui_kits/mobile/MobileApp.jsx
try { (() => {
/* Sovi Mobile — quick at-a-glance debt + transaction tracking in a phone frame. */
(function () {
  const {
    Card,
    StatBlock,
    DebtRow,
    Badge,
    Button
  } = window.SoviDesignSystem_6076be;
  const {
    Icon
  } = window.SoviIcons;
  const AreaChart = window.SoviAreaChart;
  const fmt = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
  const fmt2 = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Math.abs(n));
  function StatusBar() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--text-strong)",
        fontFamily: "var(--font-mono)"
      }
    }, "9:41"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: "6px",
        alignItems: "center",
        color: "var(--text-strong)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "server",
      size: 13
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "11px"
      }
    }, "LAN")));
  }
  function GlanceScreen() {
    const d = window.SoviData,
      s = d.summary;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "4px 18px 18px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "6px"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: "13px",
        color: "var(--text-muted)"
      }
    }, "Good morning, ", d.user.name), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: "2px 0 0",
        fontSize: "22px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "var(--text-strong)"
      }
    }, "Your money")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: "var(--accent-tint)",
        border: "1px solid var(--accent-tint-border)",
        display: "grid",
        placeItems: "center",
        color: "var(--accent)",
        fontWeight: 600
      }
    }, d.user.name[0])), /*#__PURE__*/React.createElement(Card, {
      style: {
        background: "linear-gradient(160deg, var(--surface-card), var(--bg-raised))",
        textAlign: "center",
        padding: "24px 20px"
      }
    }, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Debt-free in",
      value: s.debtFreeMonths,
      unit: "months",
      caption: s.debtFreeDate,
      size: "xl",
      tone: "accent",
      align: "center"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "16px"
      }
    }, /*#__PURE__*/React.createElement(AreaChart, {
      data: d.trend,
      height: 70,
      id: "mGlance"
    })), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "8px 0 0",
        fontSize: "12px",
        color: "var(--text-muted)"
      }
    }, fmt(s.totalDebt), " remaining \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--positive)"
      }
    }, "down 35%"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px"
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "Saved",
      value: fmt(s.interestSaved),
      tone: "positive",
      size: "sm"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
      label: "On-time",
      value: s.onTimeStreak,
      unit: "mo",
      tone: "positive",
      size: "sm"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "sovi-eyebrow",
      style: {
        margin: 0,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)"
      }
    }, "Top debts"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "12px",
        color: "var(--accent)",
        fontWeight: 500
      }
    }, "See all")), d.debts.slice(0, 2).map(debt => /*#__PURE__*/React.createElement(DebtRow, {
      key: debt.id,
      name: debt.name,
      apr: debt.apr,
      balance: debt.balance,
      progressPct: debt.progressPct,
      payoffMonths: debt.payoffMonths
    })));
  }
  function ActivityScreen() {
    const d = window.SoviData;
    const tone = {
      payment: "var(--positive)",
      income: "var(--accent)",
      spend: "var(--text-muted)"
    };
    const ic = {
      payment: "trendingDown",
      income: "arrowUpRight",
      spend: "creditCard"
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "10px 18px 18px"
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: "6px 0 0",
        fontSize: "22px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "var(--text-strong)"
      }
    }, "Activity"), /*#__PURE__*/React.createElement(Card, {
      style: {
        padding: 0,
        overflow: "hidden"
      }
    }, d.transactions.map((t, i) => /*#__PURE__*/React.createElement("div", {
      key: t.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        borderBottom: i < d.transactions.length - 1 ? "1px solid var(--border-hairline)" : "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "38px",
        height: "38px",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-input)",
        display: "grid",
        placeItems: "center",
        color: tone[t.kind]
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic[t.kind],
      size: 17
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--text-strong)"
      }
    }, t.merchant), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "2px 0 0",
        fontSize: "12px",
        color: "var(--text-faint)"
      }
    }, t.account, " \xB7 ", t.date)), /*#__PURE__*/React.createElement("span", {
      className: "sovi-numeral",
      style: {
        fontSize: "14px",
        fontWeight: 600,
        color: t.amount > 0 ? "var(--positive)" : "var(--text-strong)"
      }
    }, t.amount > 0 ? "+" : "−", fmt2(t.amount))))));
  }
  function DebtsScreen() {
    const d = window.SoviData;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "10px 18px 18px"
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: "6px 0 8px",
        fontSize: "22px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "var(--text-strong)"
      }
    }, "Debts"), d.debts.map(debt => /*#__PURE__*/React.createElement(DebtRow, {
      key: debt.id,
      name: debt.name,
      apr: debt.apr,
      balance: debt.balance,
      progressPct: debt.progressPct,
      payoffMonths: debt.payoffMonths
    })), /*#__PURE__*/React.createElement(Card, {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "var(--text-muted)",
        marginTop: "4px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 18
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "12px"
      }
    }, "Stored only on ", d.host.name)));
  }
  const TABS = [{
    key: "glance",
    label: "Home",
    icon: "home"
  }, {
    key: "activity",
    label: "Activity",
    icon: "eye"
  }, {
    key: "debts",
    label: "Debts",
    icon: "creditCard"
  }, {
    key: "settings",
    label: "Settings",
    icon: "settings"
  }];
  function TabBar({
    active,
    onNav
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        borderTop: "1px solid var(--border-hairline)",
        background: "var(--bg-void)",
        flexShrink: 0,
        paddingBottom: "8px"
      }
    }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.key,
      onClick: () => onNav(t.key),
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
        padding: "10px 0 6px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: active === t.key ? "var(--accent)" : "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 20
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "10px",
        fontWeight: 500
      }
    }, t.label))));
  }
  function MobileApp() {
    const [nav, setNav] = React.useState("glance");
    let screen;
    if (nav === "glance") screen = /*#__PURE__*/React.createElement(GlanceScreen, null);else if (nav === "activity") screen = /*#__PURE__*/React.createElement(ActivityScreen, null);else if (nav === "debts") screen = /*#__PURE__*/React.createElement(DebtsScreen, null);else screen = /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 18px"
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: "6px 0 14px",
        fontSize: "22px",
        fontWeight: 700,
        color: "var(--text-strong)"
      }
    }, "Settings"), /*#__PURE__*/React.createElement(Card, {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "var(--positive)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "server",
      size: 16
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "13px",
        fontWeight: 600
      }
    }, "sovi.home.lan \xB7 online")), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: "13px",
        color: "var(--text-muted)",
        lineHeight: 1.55
      }
    }, "No cloud. No telemetry. Sync runs on your network only.")));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: "380px",
        height: "780px",
        background: "var(--bg-app)",
        borderRadius: "44px",
        border: "10px solid #05080f",
        boxShadow: "var(--shadow-modal)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto"
      }
    }, screen), nav === "glance" && /*#__PURE__*/React.createElement("button", {
      style: {
        position: "absolute",
        right: "20px",
        bottom: "84px",
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        background: "var(--accent)",
        color: "var(--text-on-accent)",
        border: "none",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        boxShadow: "var(--glow-accent), var(--shadow-pop)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 24
    })), /*#__PURE__*/React.createElement(TabBar, {
      active: nav,
      onNav: setNav
    }));
  }
  window.SoviMobileApp = MobileApp;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/MobileApp.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.DebtRow = __ds_scope.DebtRow;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.StreakChip = __ds_scope.StreakChip;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

})();
