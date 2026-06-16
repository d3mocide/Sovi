---
name: sovi-design
description: Use this skill to generate well-branded interfaces and assets for Sovi, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- **Brand:** Sovi — self-hosted, local-first debt & finance manager. Calm, credible, private. Tagline: "Your numbers. Your stack. Your control."
- **Theme:** dark only. App bg `#0f172a`, card `#1e293b`, hairline `#334155`. Accent sky `#38bdf8` (primary buttons = dark text on sky). Progress emerald `#34d399`. Attention amber `#fbbf24`. **No alarm red — ever.**
- **Type:** Inter (UI) + JetBrains Mono (all financial numerals, tabular). 56px bold mono is the signature display number. Uppercase tracked eyebrows above stats.
- **Voice:** plain, second-person, no guilt, no emoji. Debt framed as forward progress. Privacy mentioned calmly and often.
- **Radius:** 6 / 12 / 20 / pill. **Motion:** calm, 150ms, no bounce. **Cards:** 12px, hairline border, quiet cool shadow.
- **Tokens:** link `styles.css`; use semantic aliases (`var(--surface-card)`, `var(--accent)`, `var(--positive)`).
- **Components:** mount from `_ds_bundle.js` via `window.SoviDesignSystem_6076be` (Button, Card, Badge, ProgressBar, Input, Select, SegmentedControl, Switch, StatBlock, DebtRow, StreakChip).
- **Icons:** Lucide (2px, currentColor) — see `ui_kits/Icons.jsx`. No emoji.
- **Assets:** `assets/sovi-mark.svg` (tiled), `assets/sovi-mark-bare.svg` (freestanding), `assets/sovi-wordmark.svg`, `assets/favicon.svg`.
- **UI kits:** `ui_kits/desktop/` (workspace) and `ui_kits/mobile/` (at-a-glance phone).

Source product: https://github.com/d3mocide/Sovi
