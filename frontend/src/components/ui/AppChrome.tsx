import React from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Icon, type IconName } from "./Icon";
import { useAuth } from "../../hooks/useAuth";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/accounts", label: "Accounts", icon: "wallet" },
  { to: "/spending", label: "Spending", icon: "barChart" },
  { to: "/simulator", label: "Payoff plan", icon: "sliders" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

/**
 * App shell: glass sidebar on laptops, bottom tab bar on phones (CSS in styles/layout.css).
 * Pages pass a title, an optional subtitle and actions; the content goes in the 12-column grid.
 */
export function AppShell({
  title,
  subtitle,
  actions,
  narrow,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  narrow?: boolean;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          <Logo size={28} wordmarkSize={20} />
        </div>
        <nav className="app-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon name={n.icon} size={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <div className="app-user">
          <span className="who">{user?.email}</span>
          <button onClick={async () => { await logout(); window.location.assign("/login"); }}>Sign out</button>
        </div>
      </aside>
      <main className={narrow ? "app-main narrow" : "app-main"}>
        <div className="page-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
