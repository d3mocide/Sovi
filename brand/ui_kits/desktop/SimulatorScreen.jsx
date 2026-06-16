/* Desktop Simulator — extra-payment slider, strategy toggle, payoff results. */
(function () {
  const { Card, StatBlock, SegmentedControl, Button, Badge } = window.SoviDesignSystem_6076be;
  const { Icon } = window.SoviIcons;
  const AreaChart = window.SoviAreaChart;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  // Toy payoff model so the controls feel live.
  function project(extra, strategy) {
    const base = 14;             // baseline months
    const accel = Math.min(8, Math.round(extra / 120));
    const months = Math.max(4, base - accel - (strategy === "avalanche" ? 1 : 0));
    const interest = Math.max(900, 3120 - extra * 1.4 - (strategy === "avalanche" ? 180 : 0));
    const monthsSaved = base - months;
    const interestSaved = 3120 - interest;
    // synth a descending trend for the chart
    const start = 18240;
    const trend = Array.from({ length: months + 1 }, (_, i) => Math.round(start * (1 - i / months)));
    return { months, interest, monthsSaved, interestSaved, trend };
  }

  function SimulatorScreen() {
    const [extra, setExtra] = React.useState(300);
    const [strategy, setStrategy] = React.useState("avalanche");
    const r = project(extra, strategy);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--text-strong)" }}>Payoff simulator</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Runs locally — drag to see the effect instantly.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "16px", alignItems: "start" }}>
          {/* Controls */}
          <Card style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                <p className="sovi-eyebrow" style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Extra monthly</p>
                <span className="sovi-numeral" style={{ fontSize: "22px", fontWeight: 700, color: "var(--accent)" }}>{fmt(extra)}</span>
              </div>
              <input type="range" min={0} max={1500} step={25} value={extra}
                onChange={(e) => setExtra(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)", marginTop: "6px" }}>
                <span>$0</span><span>$1,500</span>
              </div>
            </div>
            <div>
              <p className="sovi-eyebrow" style={{ margin: "0 0 12px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Strategy</p>
              <SegmentedControl value={strategy} onChange={setStrategy}
                options={[{ value: "avalanche", label: "Avalanche" }, { value: "snowball", label: "Snowball" }]} />
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--text-faint)", lineHeight: 1.5 }}>
                {strategy === "avalanche" ? "Targets the highest APR first — least interest paid." : "Targets the smallest balance first — fastest wins for momentum."}
              </p>
            </div>
            <Button variant="secondary" iconLeft={<Icon name="check" size={15} />}>Save scenario</Button>
          </Card>

          {/* Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Card><StatBlock label="Debt-free date" value={r.months} unit="mo" tone="accent" size="md" /></Card>
              <Card><StatBlock label="Total interest" value={fmt(r.interest)} tone="neutral" size="md" /></Card>
            </div>
            <Card style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", background: "var(--positive-tint)", display: "grid", placeItems: "center", color: "var(--positive)" }}>
                <Icon name="trendingDown" size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, color: "var(--text-muted)" }}>Saved vs minimums only</p>
                <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "var(--positive)" }}>
                  {r.monthsSaved} months earlier · {fmt(r.interestSaved)} less interest
                </p>
              </div>
            </Card>
            <Card>
              <p className="sovi-eyebrow" style={{ margin: "0 0 16px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Projected payoff</p>
              <AreaChart data={r.trend} height={150} id="simTrend" />
            </Card>
          </div>
        </div>
      </div>
    );
  }
  window.SoviSimulatorScreen = SimulatorScreen;
})();
