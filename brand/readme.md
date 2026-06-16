# Sovi — Design System

> **Your numbers. Your stack. Your control.**
> A self-hosted debt & financial-management platform. Calm, credible, private by design.

This repository is the brand & UI design system for **Sovi**. It exists so that any
designer or agent can produce on-brand Sovi interfaces, decks, and marketing assets
without re-deriving the look from scratch.

---

## 1. What Sovi is

Sovi is a **local-first debt and budgeting tool** that runs on the user's own hardware —
no cloud, no tracking, no data ever leaving their network. It connects accounts (via
SimpleFIN or manual entry), classifies debts, projects payoff dates, and gamifies steady
progress with streaks and a falling debt line. Its emotional thesis: **clarity without
guilt**. Debt is framed as forward progress, never alarm.

**Mission** — Give people full control over their financial data through a clean,
local-first tool that never leaves their hardware.

**Values** — Privacy by design · Ownership · Calm clarity · Simplicity without sacrificing
power · Transparency.

**Personality** — Calm, credible, modern. Slightly elegant and minimal. Tech-forward but
not intimidating. Friendly to individuals, not corporate.

### This design system reimagines Sovi for two surfaces
The source app is a single mobile-first React column. We split it by intent:
- **Desktop** — a focused *workspace* for intense work: sidebar nav, full dashboard,
  account management, and an instant payoff simulator. (`ui_kits/desktop/`)
- **Mobile** — *quick, at-a-glance* transactional tracking and debt management: a phone
  app with a glance home, activity feed, debt list, and bottom tabs. (`ui_kits/mobile/`)

### Source material
- **GitHub:** `d3mocide/Sovi` — https://github.com/d3mocide/Sovi
  The React frontend (`frontend/src/`) is the source of truth for colors, type, components
  and screens. Key files read: `theme.ts`, `components/ui/*`, `pages/*` (Login, Dashboard,
  Accounts, Simulator, Settings), and the gamification components (DebtFreeCountdown,
  DebtProgressList, StreakBadges, TrendChart). Explore the repo further to build with
  higher fidelity to the live product.
- No Figma or slide decks were provided. No logo existed in the repo (the app renders
  "Sovi" as a text wordmark) — a minimal typographic mark was created here (see §6).

---

## 2. Content fundamentals — how Sovi writes

**Voice: calm, plain, second-person.** Sovi talks *to you* ("Your numbers", "Add a debt
to see your payoff date"). It is a quiet, competent companion — never a salesperson, never
a scold.

- **Tone** — Reassuring and matter-of-fact. State the fact, skip the adjectives. The
  product's whole job is to remove anxiety from money.
- **Person** — Second person ("you", "your"). First-person plural only in marketing voice.
- **Casing** — Sentence case for everything human-readable (buttons, headings, body).
  UPPERCASE only for the tracked eyebrow labels above stats ("DEBT-FREE IN",
  "INTEREST SAVED VS MINIMUMS"). Title Case is avoided.
- **Numbers** — Currency with no cents in summaries (`$18,240`), cents only in ledgers.
  Time framed positively ("Debt-free in 14 months", "Payoff in ~11 months").
- **No guilt, no alarm.** We never say "you owe", "warning!", "overdue!" in red. Even the
  "danger" button is amber. Debt going down is the story.
- **Emoji** — None. Sovi uses no emoji anywhere. Status is carried by color + icon + word.
- **Privacy as a through-line** — Copy frequently and calmly reminds you the data is yours
  and stays local ("Nothing leaves your network", "Stored only on sovi.home.lan").

**Examples**
| We say | Not |
|---|---|
| "Debt-free in 14 months." | "You still owe a frightening $18,240!" |
| "Your numbers. Your stack. Your control." | "Bank-grade AI-powered cloud finance." |
| "Sync queued — data will update shortly." | "ERROR: refresh failed!!!" |
| "Add a debt to see your payoff date." | "You haven't set anything up yet." |

---

## 3. Visual foundations

**Overall vibe** — A dark, quiet, engineered dashboard. Deep navy fields, one confident
sky-blue accent, emerald for progress, amber for the rare nudge. It feels like a precise
instrument you trust — closer to a well-made terminal or trading panel than a consumer
fintech app, but warmer and more legible.

- **Color** — Built on Tailwind's slate + sky scales (the source `theme.ts`). Navy `#0f172a`
  app background; `#1e293b` card surfaces; `#334155` hairline borders. **Sky `#38bdf8`** is
  the single brand/action accent (primary buttons use dark navy text on sky). **Emerald
  `#34d399`** = forward progress / "paid". **Amber `#fbbf24`** = attention, the strongest
  signal we allow. **There is no alarm red anywhere.** Tints are the accent at ~15% opacity
  with a ~30% border. Full token set in `tokens/colors.css`.
- **Type** — **Inter** for all UI text; **JetBrains Mono** for every financial numeral
  (balances, APRs, countdowns, dates) so figures read as tabular *data*. Display numbers are
  large, bold, tight-tracked mono (the 56px debt-free countdown is the signature moment).
  Eyebrow labels are 12px, 600, uppercase, `0.08em` tracking, muted. Type scale in
  `tokens/typography.css`.
- **Spacing & layout** — 8px rhythm on a 4px base. Cards pad 20px. Desktop is a 248px
  sidebar + 1280px max workspace; mobile is a single ~380px column. Generous breathing room;
  nothing is cramped.
- **Backgrounds** — Flat dark fields, no photography, no busy patterns. The only gradients
  are *subtle* surface-to-surface washes on hero cards (160° `surface-card → bg-raised`) and
  a faint radial on marketing/login panels. No texture, no grain, no illustration scenes.
- **Cards** — The universal surface: `#1e293b` fill, 1px `#334155` border, **12px** radius,
  a quiet cool shadow (`0 1px 3px / 0 4px 16px` black at low opacity). Depth comes from
  surface contrast and the hairline border, not heavy drop shadows. Interactive cards lift to
  `#263348` on hover.
- **Borders & corners** — Hairline 1px borders everywhere. Radii: 6px (buttons, inputs,
  chips), 12px (cards, modals), 20px (large feature panels), pill (badges, progress, toggles).
- **Shadows** — Three quiet steps: `shadow-card`, `shadow-pop`, `shadow-modal`. A sky focus
  ring (`0 0 0 3px` sky-15%) and an optional accent glow for the mobile FAB.
- **Transparency & blur** — Sticky headers and modal scrims use a `blur(8px)` backdrop over a
  dark translucent fill (`rgba(3,7,18,0.8)` scrim). Used sparingly — chrome and overlays only.
- **Motion** — Calm and quick, **no bounce**. UI feedback at 150ms (`cubic-bezier(.4,0,.2,1)`);
  progress-bar fills ease out over 400ms. Hover = background/opacity shift; press = color
  shift (no scale). The debt line and progress bars animate; nothing loops or bounces.
- **Imagery** — Effectively none. Sovi's "imagery" is its own data: the falling trend line,
  progress bars, streak counts. If photography is ever needed, keep it cool-toned and muted.

---

## 4. Tokens

`styles.css` (root) is the single entry point — it is **only** a list of `@import`s:

| File | Contains |
|---|---|
| `tokens/fonts.css` | Inter + JetBrains Mono (Google Fonts) |
| `tokens/colors.css` | Base navy/sky/emerald/amber scales **+ semantic aliases** (`--surface-card`, `--text-muted`, `--accent`, `--positive`…) |
| `tokens/typography.css` | Families, weights, size scale, tracking, `.sovi-eyebrow` / `.sovi-numeral` helpers |
| `tokens/spacing.css` | Spacing, radii, layout widths, elevation, blur, motion easings/durations |

Always reference semantic aliases in components (`var(--surface-card)`), not raw scale values.

---

## 5. Iconography

The Sovi codebase shipped **no icon library** — it used bare Unicode glyphs (`✓ ↻ →`) for
streak badges and nothing else. For the reimagined kits we standardize on **Lucide**
(2px stroke, 24px grid, `currentColor`) — minimal, geometric, tech-forward, and a clean
match for Inter. ⚠️ *This is a substitution / upgrade from the source, not the original set —
confirm before treating it as canonical.*

- Icons live in `ui_kits/Icons.jsx` as a small `<Icon name="…" />` component with real
  Lucide path data (dashboard, wallet, sliders, settings, refresh, shield, server, lock,
  search, plus, check, trending-down, credit-card, calendar, chevron, home, eye…). Stroke
  weight 2, inherit `currentColor`, size via prop.
- **No emoji, ever.** Status = color + icon + word. Unicode glyphs are not used as icons in
  the new system.
- Add icons by copying the Lucide SVG path into `Icons.jsx`. Keep the 2px / 24px convention.

---

## 6. Brand assets

- `assets/sovi-mark.svg` — the mark: a **square frame interlocked with a rotated diamond
  around an emerald core** — an abstract "aperture" that reads as containment and ownership
  (*your data, held*). The facet (diamond) carries the weight at `2.5px` over a delicate `1.5px`
  frame; emerald core is the single owned/settled note. Set on a rounded navy tile.
- `assets/sovi-mark-bare.svg` — the same mark with no tile, for inline use on dark surfaces.
- `assets/sovi-wordmark.svg` — mark + "Sovi" wordmark lockup (Inter 700, `-0.02em`).
- `assets/favicon.svg` — tiled mark for browser tabs (legible to 16px).
- `assets/sovi-mark-legacy.svg` / `assets/sovi-wordmark-legacy.svg` — the prior
  descending-line mark, retained for reference.
- Clearspace = the mark's height on all sides. Minimum mark size 16px (favicon-tested). The
  wordmark may be set as live text in Inter 700 where SVG isn't practical.
- The mark was selected from the Aperture & Ledger finalist study; emerald core can shift to
  violet if differentiation from the in-app "progress" green is ever wanted.

---

## 7. Components

Reusable React primitives (compiled into the runtime bundle; mount via
`window.SoviDesignSystem_6076be`). See each component's `.prompt.md` for usage.

**core/** — `Button` (primary / secondary / ghost / danger-amber), `Card` (the universal
surface), `Badge` (status pills), `ProgressBar` (emerald-by-default).
**forms/** — `Input` (labelled, amber error), `Select`, `SegmentedControl` (the strategy
toggle), `Switch`.
**data/** — `StatBlock` (the eyebrow + big mono numeral signature), `DebtRow` (per-debt
payoff card), `StreakChip` (gamification badge).

---

## 8. UI kits

- **`ui_kits/desktop/`** — `index.html` is an interactive workspace: log in → Dashboard
  (countdown, trend chart, debt list, streaks) → Accounts (classify + debt-detail modal) →
  Simulator (live slider + strategy) → Settings. Screens: `Shell`, `DashboardScreen`,
  `AccountsScreen`, `SimulatorScreen`, plus `AreaChart` (lightweight SVG, replaces recharts)
  and shared `data.js`.
- **`ui_kits/mobile/`** — `index.html` renders a phone with bottom tabs: Home (glance),
  Activity (transactions), Debts, Settings, and a quick-add FAB. Screens in `MobileApp.jsx`,
  reusing the desktop `data.js`, `Icons.jsx`, and `AreaChart.jsx`.

---

## 9. Index / manifest

```
styles.css                 ← root entry (import list only)
tokens/                    fonts · colors · typography · spacing
assets/                    sovi-mark.svg · sovi-mark-bare.svg · sovi-wordmark.svg · favicon.svg
guidelines/                foundation specimen cards (Colors · Type · Spacing · Brand)
components/
  core/                    Button · Card · Badge · ProgressBar  (+ core.card.html)
  forms/                   Input · Select · SegmentedControl · Switch  (+ forms.card.html)
  data/                    StatBlock · DebtRow · StreakChip  (+ data.card.html)
ui_kits/
  Icons.jsx                shared Lucide icon set
  desktop/                 index.html + Shell/Dashboard/Accounts/Simulator + AreaChart + data.js
  mobile/                  index.html + MobileApp.jsx
SKILL.md                   Agent-Skill manifest
readme.md                  this file
```

Every `.html` tagged `<!-- @dsCard … -->` appears in the Design System tab, grouped by
section. Components mount from the generated `_ds_bundle.js` under the namespace
`window.SoviDesignSystem_6076be`.

---

## 10. Caveats
- **Fonts** are loaded from Google Fonts (Inter + JetBrains Mono — the authentic fonts), not
  self-hosted binaries. Drop `.woff2` files in `assets/fonts` and swap the import for offline use.
- **Icons** are a Lucide substitution for the source app's bare Unicode glyphs.
- **Logo** is an original mark; no official Sovi logo existed in the repo.
- Desktop/mobile kits are a *reimagining* per the brief, not 1:1 recreations of the source
  mobile-only app.
