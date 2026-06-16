import React from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Icon, type IconName } from "./Icon";
import { theme } from "../../theme";

/**
 * Shared app chrome — sticky brand header + icon tab nav. Centralizes the
 * Sovi mark and primary navigation so every screen reads identically.
 */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: `1px solid ${theme.colors.border}`,
        position: "sticky",
        top: 0,
        background: "color-mix(in srgb, var(--bg-app) 88%, transparent)",
        backdropFilter: "var(--blur-overlay)",
        WebkitBackdropFilter: "var(--blur-overlay)",
        zIndex: 20,
      }}
    >
      <Logo size={28} wordmarkSize={20} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>{children}</div>
    </header>
  );
}

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/accounts", label: "Accounts", icon: "wallet" },
  { to: "/simulator", label: "Simulator", icon: "sliders" },
];

export function TabNav() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "4px",
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: "0 16px",
        overflowX: "auto",
      }}
    >
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === "/"} style={{ textDecoration: "none" }}>
          {({ isActive }) => (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: isActive ? theme.colors.accent : theme.colors.textMuted,
                borderBottom: `2px solid ${isActive ? theme.colors.accent : "transparent"}`,
                whiteSpace: "nowrap",
                transition: `color ${theme.motion.durFast} ${theme.motion.easeStandard}`,
              }}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
