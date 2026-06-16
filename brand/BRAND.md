# Sovi — Brand & UI Spec (for coding agents)

> **Your numbers. Your stack. Your control.**
> Local-first debt & budgeting tool that runs on the user's own hardware. No cloud, no tracking, nothing leaves their network. Brand = **calm, credible, private by design**. Feels like a precise instrument (a well-made terminal/trading panel) — but warmer and more legible than that. Emotional thesis: **clarity without guilt**; debt is forward progress, never alarm.

This file is the machine-readable companion to `readme.md`. Hard values below are canonical — copy them verbatim. The single source of truth at runtime is `styles.css` (imports `tokens/*.css`). Always reference **semantic CSS aliases** (`var(--accent)`), never raw scale values, in product code.

---

## 1. Non-negotiable rules

- **No alarm red, anywhere.** The strongest warning color is amber `#fbbf24`. Even the "danger" button is amber. Debt going down is the story.
- **No emoji, ever.** Status = color + icon + word. No exceptions.
- **Second person, sentence case.** "Your numbers." UPPERCASE only for tracked eyebrow labels. No Title Case.
- **No guilt / no scolding.** Never "you owe", "warning!", "overdue!". State the fact, skip adjectives.
- **Privacy is a through-line.** Calmly reassure data is local ("Nothing leaves your network").
- **Numerals are mono.** Every financial figure (balance, APR, countdown, date) uses JetBrains Mono, tabular.
- **Icons = Lucide only**, 2px stroke, 24px grid, `currentColor`. No Unicode glyphs as icons.
- **Motion has no bounce.** Calm + quick. Press = color shift, never scale.

---

## 2. Color tokens

Base scales (Tailwind slate + sky). Reference semantic aliases in code.

### Navy / Slate (neutral spine)
| Token | Hex | Role |
|---|---|---|
| `--navy-950` | `#0a1222` | deepest — app letterbox / void |
| `--navy-900` | `#0f172a` | **app background** (`--bg-app`) |
| `--navy-850` | `#131d33` | raised bg / sunken input (`--bg-raised`) |
| `--navy-800` | `#1e293b` | **card surface** (`--surface-card`) |
| `--navy-750` | `#263348` | surface hover (`--surface-card-hover`) |
| `--navy-700` | `#334155` | **hairline border** (`--border-hairline`) |
| `--navy-600` | `#475569` | strong border / disabled fg (`--border-strong`) |
| `--navy-500` | `#64748b` | faint text (`--text-faint`) |
| `--navy-400` | `#94a3b8` | muted text (`--text-muted`) |
| `--navy-300` | `#cbd5e1` | secondary text (`--text-secondary`) |
| `--navy-200` | `#e2e8f0` | **primary text** (`--text-strong` / `--text-body`) |
| `--navy-100` | `#f1f5f9` | near-white light surface |
| `--navy-050` | `#f8fafc` | lightest |

### Accents
| Token | Hex | Semantic | Use |
|---|---|---|---|
| `--sky-400` | `#38bdf8` | `--accent` | **primary brand / action.** Buttons = dark navy text on sky. |
| `--sky-500` | `#0ea5e9` | `--accent-strong` | pressed / strong |
| `--emerald-400` | `#34d399` | `--positive` | forward progress / "paid" / streaks / the logo core |
| `--amber-400` | `#fbbf24` | `--attention` | attention — strongest signal allowed (the "danger" button) |
| `--violet-400` | `#a78bfa` | `--data-4` | secondary data (charts, simulator B series) |

- **Tints:** accent at ~15% opacity fill + ~30% opacity border. (`--sky-glow` `rgba(56,189,248,.15)`, `--sky-glow-strong` `rgba(56,189,248,.3)`; same pattern for emerald/amber.)
- **Input fills:** `--surface-input #0f1f35`, `--surface-input-deep #0a1628`.
- **Modal scrim:** `rgba(3,7,18,0.8)` + `blur(8px)`.
- **Data viz order:** `--data-1` sky → `--data-2` emerald → `--data-3` amber → `--data-4` violet.

---

## 3. Typography

- **UI / text:** Inter — `--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`
- **Numerals / data:** JetBrains Mono — `--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`
- Loaded via Google Fonts (weights 400/500/600/700). Swap to self-hosted `.woff2` in `assets/fonts` for offline.

### Scale (px)
`--text-2xs 10` · `--text-xs 11` · `--text-sm 13` · `--text-base 14` · `--text-md 15` · `--text-lg 18` · `--text-xl 20` · `--text-2xl 28` · `--text-3xl 32` · `--text-5xl 56`

### Weights & tracking
- Weights: 400 / 500 / 600 / 700.
- Tracking: `-0.02em` large display & wordmark · `-0.01em` page titles · `0` body · `0.02em` input labels · `0.08em` uppercase eyebrows.
- Line heights: `1` none · `1.2` tight · `1.35` snug · `1.55` normal.

### Roles
| Role | Spec |
|---|---|
| Hero stat (countdown) | JetBrains Mono · 700 · 56px · `-0.02em` · the signature moment |
| Page title | Inter · 700 · 28px · `-0.01em` |
| Section heading | Inter · 600 · 18px |
| Body / input / button | Inter · 400 · 14px · lh 1.55 |
| Eyebrow label | Inter · 600 · 12px · UPPERCASE · `0.08em` · muted |
| Numeral | `.sovi-numeral` — mono, `font-variant-numeric: tabular-nums`, `-0.02em` |

---

## 4. Spacing, radii, elevation, motion

- **Spacing (4px base, 8px rhythm):** 0/4/8/12/16/20/24/32/40/48/64. Card padding = **20px**. Page gutter = **24px**.
- **Layout:** mobile single column `~380px` (`--content-max 680`); desktop `--desktop-max 1280px` + `--sidebar-w 248px`. Hairline = 1px.
- **Radii:** `--radius-xs 4` · `--radius-sm 6` (buttons, inputs, chips) · `--radius-md 12` (cards, modals) · `--radius-lg 20` (feature panels) · `--radius-pill 999` (badges, progress, toggles).
- **Elevation (quiet, cool):**
  - `--shadow-card`: `0 1px 3px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.2)`
  - `--shadow-pop`: `0 8px 24px rgba(0,0,0,.35)`
  - `--shadow-modal`: `0 20px 25px -5px rgba(0,0,0,.5), 0 10px 10px -5px rgba(0,0,0,.5)`
  - `--shadow-focus`: `0 0 0 3px rgba(56,189,248,.15)` (sky ring)
  - Depth comes from the hairline border + surface contrast, **not** heavy shadows.
- **Motion:** `--ease-standard cubic-bezier(.4,0,.2,1)` · `--ease-out cubic-bezier(.16,1,.3,1)`. Durations: `--dur-fast .15s` (hover/press) · `--dur-base .25s` · `--dur-slow .4s` (progress fills). Hover = bg/opacity shift; press = color shift, **no scale**; nothing loops or bounces.
- **Blur:** `--blur-overlay blur(8px)` — sticky headers & modal scrims only.

---

## 5. The mark (logo)

Abstract **"aperture"**: a square frame interlocked with a rotated diamond around an emerald core → containment + ownership (*your data, held*). The facet (diamond) carries the weight over a delicate frame; the emerald core is the single owned/settled note.

**Canonical geometry (64×64 viewBox):**
```
tile:    <rect x="1" y="1" width="62" height="62" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
diamond: <path d="M32 12 L52 32 L32 52 L12 32 Z" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linejoin="round"/>
frame:   <rect x="18" y="18" width="28" height="28" rx="3" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
core:    <circle cx="32" cy="32" r="2.6" fill="#34d399"/>
```
- **Frame** (square): stroke `1.5px`, radius `3`. **Facet** (diamond): stroke `2.5px`. **Core:** emerald `#34d399`, `r 2.6`. **Strokes:** sky `#38bdf8`.
- **Clearspace:** the mark's full height on all four sides. **Min size: 16px** (favicon-tested).
- **On light:** strokes → navy `#1e293b`, core → `#059669`. **Monochrome:** all strokes + core one color (e.g. `#e2e8f0`).
- **Core color** may shift to violet `#a78bfa` *only* to differentiate from the in-app "progress" emerald — otherwise stays emerald.
- **Wordmark:** "Sovi" in Inter **700**, tracking `-0.02em`, set as live text where SVG isn't practical.
- **Don't:** recolor strokes, gradient-fill the frame, rotate/stretch, add drop shadow, or shrink below 16px.

### Assets (`assets/`)
| File | Use |
|---|---|
| `sovi-mark.svg` | primary — mark on rounded navy tile (app icon) |
| `sovi-mark-bare.svg` | freestanding, no tile — inline on dark surfaces |
| `sovi-wordmark.svg` | mark + "Sovi" lockup |
| `favicon.svg` | full-bleed tile (no border stroke), legible to 16px |
| `sovi-mark-legacy.svg` / `sovi-wordmark-legacy.svg` | prior descending-line mark, reference only — **do not use** |

---

## 6. Voice — copy patterns

| Say | Not |
|---|---|
| "Debt-free in 14 months." | "You still owe a frightening $18,240!" |
| "Your numbers. Your stack. Your control." | "Bank-grade AI-powered cloud finance." |
| "Sync queued — data will update shortly." | "ERROR: refresh failed!!!" |
| "Add a debt to see your payoff date." | "You haven't set anything up yet." |

- Currency: no cents in summaries (`$18,240`), cents only in ledgers. Frame time positively ("Debt-free in 14 months", "Payoff in ~11 months").
- Person: second person; first-person plural only in marketing voice.

---

## 7. Components (runtime bundle)

Mount from `_ds_bundle.js` via `window.SoviDesignSystem_6076be`. See each component's `.prompt.md` for props.

- **core/** — `Button` (primary / secondary / ghost / danger-amber), `Card` (universal surface: `#1e293b` fill, 1px `#334155` border, 12px radius, `--shadow-card`; hover → `#263348`), `Badge` (status pills), `ProgressBar` (emerald default).
- **forms/** — `Input` (labelled, amber error), `Select`, `SegmentedControl` (strategy toggle), `Switch`.
- **data/** — `StatBlock` (eyebrow + big mono numeral — the signature), `DebtRow` (per-debt payoff card), `StreakChip` (gamification badge).

Available names: `Badge, Button, Card, ProgressBar, DebtRow, StatBlock, StreakChip, Input, SegmentedControl, Select, Switch`.

---

## 8. Surfaces, icons, imagery

- **Backgrounds:** flat dark fields. No photography, no patterns, no grain. Only gradients allowed = *subtle* 160° `surface-card → bg-raised` washes on hero cards + a faint radial on login/marketing panels.
- **Cards:** the universal surface (see above). Depth from contrast + hairline, not shadow.
- **Icons:** Lucide, 2px / 24px / `currentColor`, in `ui_kits/Icons.jsx`. ⚠️ This is a substitution for the source app's bare Unicode glyphs — not original-canonical.
- **Imagery:** effectively none. Sovi's "imagery" is its own data — the falling trend line, progress bars, streak counts. Any photography (rare) stays cool-toned and muted.

---

## 9. File map

```
styles.css            root entry — @import list only
tokens/               fonts · colors · typography · spacing (semantic aliases live here)
assets/               sovi-mark · sovi-mark-bare · sovi-wordmark · favicon (+ *-legacy)
guidelines/           foundation specimen cards (@dsCard)
components/  core/ forms/ data/   React primitives + .card.html specimens
ui_kits/     Icons.jsx · desktop/ · mobile/
Sovi Brand.html       human-readable brand page (companion to this file)
BRAND.md              this file
readme.md             full prose system doc
```

---

## 10. Caveats

- Fonts: Google Fonts (authentic Inter + JetBrains Mono), not self-hosted. Drop `.woff2` in `assets/fonts` + swap the import for offline.
- Icons: Lucide is an upgrade/substitution for the source app's Unicode glyphs — confirm before treating as canonical.
- Logo: original mark; no official Sovi logo existed in the source repo.
- Desktop/mobile kits are a *reimagining* per brief, not 1:1 recreations of the source mobile-only app.
- Source of truth for product behavior: `d3mocide/Sovi` — https://github.com/d3mocide/Sovi (`frontend/src/theme.ts`, `components/ui/*`, `pages/*`).
