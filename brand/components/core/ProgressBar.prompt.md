Slim, rounded progress track. In Sovi a filling bar means progress *paid off*, so it defaults to emerald — pass `color="var(--accent)"` for sky or `var(--attention)` for amber.

```jsx
<ProgressBar value={debt.progress_pct} />
<ProgressBar value={72} color="var(--accent)" height={8} />
```

`value` is clamped 0–100. The fill animates with the slow ease (`--dur-slow`).
