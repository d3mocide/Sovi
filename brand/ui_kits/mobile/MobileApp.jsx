/* Sovi Mobile — quick at-a-glance debt + transaction tracking in a phone frame. */
(function () {
  const { Card, StatBlock, DebtRow, Badge, Button } = window.SoviDesignSystem_6076be;
  const { Icon } = window.SoviIcons;
  const AreaChart = window.SoviAreaChart;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const fmt2 = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Math.abs(n));

  function StatusBar() {
    return (
      <div style={{ height: "44px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", flexShrink: 0 }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>9:41</span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "var(--text-strong)" }}>
          <Icon name="server" size={13} /><span style={{ fontSize: "11px" }}>LAN</span>
        </div>
      </div>
    );
  }

  function GlanceScreen() {
    const d = window.SoviData, s = d.summary;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Good morning, {d.user.name}</p>
            <h1 style={{ margin: "2px 0 0", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>Your money</h1>
          </div>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--accent-tint)", border: "1px solid var(--accent-tint-border)", display: "grid", placeItems: "center", color: "var(--accent)", fontWeight: 600 }}>{d.user.name[0]}</div>
        </div>

        <Card style={{ background: "linear-gradient(160deg, var(--surface-card), var(--bg-raised))", textAlign: "center", padding: "24px 20px" }}>
          <StatBlock label="Debt-free in" value={s.debtFreeMonths} unit="months" caption={s.debtFreeDate} size="xl" tone="accent" align="center" />
          <div style={{ marginTop: "16px" }}><AreaChart data={d.trend} height={70} id="mGlance" /></div>
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{fmt(s.totalDebt)} remaining · <span style={{ color: "var(--positive)" }}>down 35%</span></p>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Card><StatBlock label="Saved" value={fmt(s.interestSaved)} tone="positive" size="sm" /></Card>
          <Card><StatBlock label="On-time" value={s.onTimeStreak} unit="mo" tone="positive" size="sm" /></Card>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="sovi-eyebrow" style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Top debts</p>
          <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 500 }}>See all</span>
        </div>
        {d.debts.slice(0, 2).map((debt) => (
          <DebtRow key={debt.id} name={debt.name} apr={debt.apr} balance={debt.balance} progressPct={debt.progressPct} payoffMonths={debt.payoffMonths} />
        ))}
      </div>
    );
  }

  function ActivityScreen() {
    const d = window.SoviData;
    const tone = { payment: "var(--positive)", income: "var(--accent)", spend: "var(--text-muted)" };
    const ic = { payment: "trendingDown", income: "arrowUpRight", spend: "creditCard" };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "10px 18px 18px" }}>
        <h1 style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>Activity</h1>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {d.transactions.map((t, i) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: i < d.transactions.length - 1 ? "1px solid var(--border-hairline)" : "none" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-sm)", background: "var(--surface-input)", display: "grid", placeItems: "center", color: tone[t.kind] }}>
                <Icon name={ic[t.kind]} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-strong)" }}>{t.merchant}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-faint)" }}>{t.account} · {t.date}</p>
              </div>
              <span className="sovi-numeral" style={{ fontSize: "14px", fontWeight: 600, color: t.amount > 0 ? "var(--positive)" : "var(--text-strong)" }}>
                {t.amount > 0 ? "+" : "−"}{fmt2(t.amount)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  function DebtsScreen() {
    const d = window.SoviData;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "10px 18px 18px" }}>
        <h1 style={{ margin: "6px 0 8px", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>Debts</h1>
        {d.debts.map((debt) => (
          <DebtRow key={debt.id} name={debt.name} apr={debt.apr} balance={debt.balance} progressPct={debt.progressPct} payoffMonths={debt.payoffMonths} />
        ))}
        <Card style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
          <Icon name="shield" size={18} /><span style={{ fontSize: "12px" }}>Stored only on {d.host.name}</span>
        </Card>
      </div>
    );
  }

  const TABS = [
    { key: "glance", label: "Home", icon: "home" },
    { key: "activity", label: "Activity", icon: "eye" },
    { key: "debts", label: "Debts", icon: "creditCard" },
    { key: "settings", label: "Settings", icon: "settings" },
  ];

  function TabBar({ active, onNav }) {
    return (
      <div style={{ display: "flex", borderTop: "1px solid var(--border-hairline)", background: "var(--bg-void)", flexShrink: 0, paddingBottom: "8px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => onNav(t.key)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            padding: "10px 0 6px", border: "none", background: "transparent", cursor: "pointer",
            color: active === t.key ? "var(--accent)" : "var(--text-faint)",
          }}>
            <Icon name={t.icon} size={20} />
            <span style={{ fontSize: "10px", fontWeight: 500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function MobileApp() {
    const [nav, setNav] = React.useState("glance");
    let screen;
    if (nav === "glance") screen = <GlanceScreen />;
    else if (nav === "activity") screen = <ActivityScreen />;
    else if (nav === "debts") screen = <DebtsScreen />;
    else screen = (
      <div style={{ padding: "10px 18px" }}>
        <h1 style={{ margin: "6px 0 14px", fontSize: "22px", fontWeight: 700, color: "var(--text-strong)" }}>Settings</h1>
        <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--positive)" }}><Icon name="server" size={16} /><span style={{ fontSize: "13px", fontWeight: 600 }}>sovi.home.lan · online</span></div>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.55 }}>No cloud. No telemetry. Sync runs on your network only.</p>
        </Card>
      </div>
    );

    return (
      <div style={{
        width: "380px", height: "780px", background: "var(--bg-app)", borderRadius: "44px",
        border: "10px solid #05080f", boxShadow: "var(--shadow-modal)", overflow: "hidden",
        display: "flex", flexDirection: "column", position: "relative",
      }}>
        <StatusBar />
        <div style={{ flex: 1, overflowY: "auto" }}>{screen}</div>
        {nav === "glance" && (
          <button style={{
            position: "absolute", right: "20px", bottom: "84px", width: "52px", height: "52px",
            borderRadius: "50%", background: "var(--accent)", color: "var(--text-on-accent)",
            border: "none", display: "grid", placeItems: "center", cursor: "pointer",
            boxShadow: "var(--glow-accent), var(--shadow-pop)",
          }}><Icon name="plus" size={24} /></button>
        )}
        <TabBar active={nav} onNav={setNav} />
      </div>
    );
  }

  window.SoviMobileApp = MobileApp;
})();
