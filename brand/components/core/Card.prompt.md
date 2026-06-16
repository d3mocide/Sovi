The universal Sovi surface — hairline border, 12px radius, quiet cool shadow. Pass `onClick` (or `interactive`) to get the hover surface-shift and pointer.

```jsx
<Card>
  <p className="sovi-eyebrow">Interest saved vs minimums</p>
  <p className="sovi-numeral" style={{ fontSize: 32, color: "var(--positive)" }}>$1,284</p>
</Card>

<Card onClick={open}>Tap to view account</Card>
```

Default padding is 20px; override via `style={{ padding: "16px 20px" }}`. Compose the eyebrow + numeral pattern inside for the recurring "stat" look.
