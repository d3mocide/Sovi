Gamification badge — big mono count + label + optional "Best: N". Count goes emerald when active, muted at zero. Sovi rewards are calm, never guilt-trippy.

```jsx
<div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
  <StreakChip count={7} label="On-time payments" best={12} />
  <StreakChip count={3} label="Daily syncs" best={9} />
  <StreakChip count={0} label="No new debt" />
</div>
```
