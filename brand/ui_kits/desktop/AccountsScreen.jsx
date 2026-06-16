/* Desktop Accounts — manage connected & manual accounts; classify debts. */
(function () {
  const { Card, Badge, Button } = window.SoviDesignSystem_6076be;
  const { Icon } = window.SoviIcons;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
  const TYPE_LABEL = { checking: "Checking", savings: "Savings", credit_card: "Credit Card", loan: "Loan", investment: "Investment", other: "Other" };
  const TYPE_ICON = { checking: "wallet", savings: "wallet", credit_card: "creditCard", loan: "creditCard", investment: "arrowUpRight", other: "wallet" };

  function AccountRow({ a, onOpen }) {
    const [hover, setHover] = React.useState(false);
    const neg = a.balance < 0;
    return (
      <div
        onClick={() => onOpen(a)}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          display: "grid", gridTemplateColumns: "40px 1fr auto auto", alignItems: "center", gap: "16px",
          padding: "14px 18px", cursor: "pointer",
          background: hover ? "var(--surface-card-hover)" : "transparent",
          borderBottom: "1px solid var(--border-hairline)", transition: "background var(--dur-fast)",
        }}
      >
        <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", background: "var(--surface-input)", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
          <Icon name={TYPE_ICON[a.type]} size={18} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-strong)" }}>{a.name}</span>
            {a.needsClass && <Badge variant="warning">Needs classification</Badge>}
            {a.hasDebt && <Badge variant="muted">{a.apr}% APR</Badge>}
          </div>
          <div style={{ marginTop: "3px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge variant="muted">{TYPE_LABEL[a.type]}</Badge>
            <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>{a.isManual ? "Manual" : "SimpleFIN"}</span>
          </div>
        </div>
        <span className="sovi-numeral" style={{ fontSize: "15px", fontWeight: 600, color: neg ? "var(--text-strong)" : "var(--positive)" }}>
          {fmt(a.balance)}
        </span>
        <Icon name="chevronRight" size={18} style={{ color: "var(--text-faint)" }} />
      </div>
    );
  }

  function AccountsScreen({ onOpen }) {
    const d = window.SoviData;
    const needs = d.accounts.filter((a) => a.needsClass).length;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--text-strong)" }}>Accounts</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              {d.accounts.length} accounts{needs > 0 ? ` — ${needs} need classification` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="secondary" size="sm" iconLeft={<Icon name="refresh" size={14} />}>Sync now</Button>
            <Button variant="primary" size="sm" iconLeft={<Icon name="plus" size={14} />}>Add manual</Button>
          </div>
        </div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {d.accounts.map((a) => <AccountRow key={a.id} a={a} onOpen={onOpen} />)}
        </Card>
      </div>
    );
  }
  window.SoviAccountsScreen = AccountsScreen;
})();
