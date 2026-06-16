Sovi's primary action button — sky-filled primary, bordered secondary, quiet ghost, and an amber `danger` (Sovi never uses alarm red). Use exactly one primary action per view.

```jsx
<Button variant="primary" size="md" onClick={save}>Save scenario</Button>
<Button variant="secondary">Refresh data</Button>
<Button variant="ghost" size="sm">Cancel</Button>
```

Variants: `primary` (sky bg, navy text), `secondary` (surface + hairline border), `ghost` (transparent, muted text), `danger` (amber tint + amber border). Sizes: `sm` / `md` / `lg`. Pass `loading` to disable + show "Loading…", or `iconLeft` / `iconRight` for icon affordances.
