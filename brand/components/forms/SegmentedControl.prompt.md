Pill-button group for mutually-exclusive choices — the simulator's strategy toggle. The active segment gets sky tint + border + text.

```jsx
<SegmentedControl
  value={strategy}
  onChange={setStrategy}
  options={[
    { value: "avalanche", label: "Avalanche" },
    { value: "snowball", label: "Snowball" },
    { value: "side-by-side", label: "Side-by-side" },
  ]}
/>
```

Accepts plain strings or `{value,label}` objects. Use `size="sm"` inside dense toolbars.
