One debt's payoff card — name + APR on the left, balance + "% paid" on the right, emerald progress bar, optional payoff estimate. Builds the dashboard debt list.

```jsx
<DebtRow name="Chase Sapphire" apr={24.99} balance={4820}
         progressPct={38} payoffMonths={11} />
```

Currency is auto-formatted (USD, no cents). Stack several in a `flex column gap:12px`. Composes `Card` + `ProgressBar`.
