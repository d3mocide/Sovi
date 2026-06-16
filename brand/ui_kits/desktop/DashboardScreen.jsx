/* Desktop Dashboard — the at-a-glance "intense work" overview. */
(function () {
  const { Card, StatBlock, DebtRow, StreakChip, Button, Badge } = window.SoviDesignSystem_6076be;
  const { Icon } = window.SoviIcons;
  const AreaChart = window.SoviAreaChart;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  function DashboardScreen() {
    const d = window.SoviData;
    const s = d.summary;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Hero row: countdown + 3 stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: "16px" }}>
          <Card style={{ background: "linear-gradient(160deg, var(--surface-card), var(--bg-raised))" }}>
            <StatBlock label="Debt-free in" value={s.debtFreeMonths} unit="months"
              caption={`${s.debtFreeDate} · ${fmt(s.totalDebt)} remaining`} size="xl" tone="accent" />
          </Card>
          <Card><StatBlock label="Interest saved" value={fmt(s.interestSaved)} tone="positive" size="md" /></Card>
          <Card><StatBlock label="Paid this year" value={fmt(s.paidThisYear)} tone="neutral" size="md" /></Card>
          <Card>
            <StatBlock label="On-time streak" value={s.onTimeStreak} unit="mo" tone="positive" size="md" />
            <Badge variant="positive" style={{ marginTop: "12px" }}><Icon name="check" size={12} /> Best yet</Badge>
          </Card>
        </div>

        {/* Trend + debts */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", alignItems: "start" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <p className="sovi-eyebrow" style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Total debt · 90-day trend</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--positive)", fontSize: "13px", fontWeight: 600 }}>
                <Icon name="trendingDown" size={15} /> −35%
              </span>
            </div>
            <AreaChart data={d.trend} height={200} id="dashTrend" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)" }}>
              <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="sovi-eyebrow" style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Debt progress</p>
              <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={14} />}>Add</Button>
            </div>
            {d.debts.map((debt) => (
              <DebtRow key={debt.id} name={debt.name} apr={debt.apr} balance={debt.balance}
                progressPct={debt.progressPct} payoffMonths={debt.payoffMonths} />
            ))}
          </div>
        </div>

        {/* Streaks */}
        <div>
          <p className="sovi-eyebrow" style={{ margin: "0 0 12px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Streaks</p>
          <div style={{ display: "flex", gap: "12px" }}>
            {d.streaks.map((st) => (
              <StreakChip key={st.type} count={st.count} label={st.type} best={st.best} />
            ))}
            <Card style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
              <Icon name="shield" size={20} />
              <span style={{ fontSize: "13px" }}>All data stays on <strong style={{ color: "var(--text-secondary)" }}>{d.host.name}</strong>. Nothing leaves your network.</span>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  window.SoviDashboardScreen = DashboardScreen;
})();
