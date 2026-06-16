The signature Sovi figure — uppercase eyebrow + a big tabular-mono numeral. Used everywhere on the dashboard. Place inside a `Card`.

```jsx
<Card>
  <StatBlock label="Debt-free in" value="14" unit="months"
             caption="March 2027 · $18,240 remaining" size="xl" />
</Card>

<Card>
  <StatBlock label="Interest saved vs minimums" value="$1,284"
             tone="positive" size="md" />
</Card>
```

Tones: `accent` (sky, the headline), `positive` (emerald, savings), `neutral`, `attention`. Sizes `sm`→`xl`. Numerals are mono + tabular so columns align.
