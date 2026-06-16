/* Desktop workspace chrome: left sidebar + top bar. */
(function () {
  const { Icon } = window.SoviIcons;
  const { Badge } = window.SoviDesignSystem_6076be;

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "accounts", label: "Accounts", icon: "wallet" },
    { key: "simulator", label: "Simulator", icon: "sliders" },
  ];

  function NavItem({ item, active, onClick }) {
    const [hover, setHover] = React.useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: "11px", width: "100%",
          padding: "9px 12px", borderRadius: "var(--radius-sm)", border: "none",
          cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "14px",
          fontWeight: 500, textAlign: "left",
          color: active ? "var(--accent)" : hover ? "var(--text-body)" : "var(--text-muted)",
          background: active ? "var(--accent-tint)" : hover ? "var(--surface-card)" : "transparent",
          transition: "all var(--dur-fast) var(--ease-standard)",
        }}
      >
        <Icon name={item.icon} size={18} />
        {item.label}
      </button>
    );
  }

  function Sidebar({ active, onNav }) {
    const d = window.SoviData;
    return (
      <aside style={{
        width: "var(--sidebar-w)", flexShrink: 0, background: "var(--bg-void)",
        borderRight: "1px solid var(--border-hairline)", display: "flex",
        flexDirection: "column", padding: "20px 14px", boxSizing: "border-box",
        height: "100vh", position: "sticky", top: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 8px 22px" }}>
          <img src="../../assets/sovi-mark.svg" width="32" height="32" alt="" />
          <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>Sovi</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {NAV.map((i) => (
            <NavItem key={i.key} item={i} active={active === i.key} onClick={() => onNav(i.key)} />
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <NavItem item={{ label: "Settings", icon: "settings" }} active={active === "settings"} onClick={() => onNav("settings")} />
        <div style={{
          marginTop: "12px", padding: "12px", borderRadius: "var(--radius-md)",
          background: "var(--surface-card)", border: "1px solid var(--border-hairline)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--positive)", marginBottom: "6px" }}>
            <Icon name="server" size={15} />
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Self-hosted</span>
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {d.host.name}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-faint)" }}>
            Synced {d.host.synced}
          </p>
        </div>
      </aside>
    );
  }

  function Topbar({ title, onRefresh, refreshing }) {
    const d = window.SoviData;
    return (
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: "64px", flexShrink: 0,
        borderBottom: "1px solid var(--border-hairline)",
        position: "sticky", top: 0, background: "color-mix(in srgb, var(--bg-app) 88%, transparent)",
        backdropFilter: "var(--blur-overlay)", zIndex: 20,
      }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>
          {title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px",
            background: "var(--surface-input)", border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-sm)", color: "var(--text-faint)", fontSize: "13px", width: "200px",
          }}>
            <Icon name="search" size={15} />
            <span>Search…</span>
          </div>
          <button onClick={onRefresh} title="Refresh data" style={{
            display: "grid", placeItems: "center", width: "38px", height: "38px",
            borderRadius: "var(--radius-sm)", border: "1px solid var(--border-hairline)",
            background: "var(--surface-card)", color: "var(--text-muted)", cursor: "pointer",
          }}>
            <Icon name="refresh" size={17} style={{ animation: refreshing ? "sovi-spin 0.9s linear infinite" : "none" }} />
          </button>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent-tint)",
            border: "1px solid var(--accent-tint-border)", display: "grid", placeItems: "center",
            color: "var(--accent)", fontWeight: 600, fontSize: "14px",
          }}>
            {d.user.name[0]}
          </div>
        </div>
      </header>
    );
  }

  function Shell({ active, onNav, title, onRefresh, refreshing, children }) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
        <Sidebar active={active} onNav={onNav} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar title={title} onRefresh={onRefresh} refreshing={refreshing} />
          <main style={{ flex: 1, padding: "28px", maxWidth: "var(--desktop-max)", width: "100%", boxSizing: "border-box", margin: "0 auto" }}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  window.SoviShell = { Shell, Sidebar, Topbar };
})();
