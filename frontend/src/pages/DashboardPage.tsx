import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useGamification } from "../hooks/useGamification";
import { api } from "../api/client";
import { DebtFreeCountdown } from "../components/DebtFreeCountdown";
import { DebtProgressList } from "../components/DebtProgressList";
import { TrendChart } from "../components/TrendChart";
import { StreakBadges } from "../components/StreakBadges";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { theme } from "../theme";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useGamification();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      await api.post("/simplefin/refresh");
      setRefreshMsg("Sync queued — data will update shortly.");
      setTimeout(() => refresh(), 3000);
    } catch (err) {
      setRefreshMsg(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bg }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.colors.border}`,
          position: "sticky",
          top: 0,
          background: theme.colors.bg,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: theme.colors.text,
            letterSpacing: "-0.01em",
          }}
        >
          Sovi
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>
            {user?.email}
          </span>
          <Link
            to="/settings"
            style={{
              fontSize: "13px",
              color: theme.colors.textMuted,
              padding: "4px 10px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
            }}
          >
            Settings
          </Link>
        </div>
      </header>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          gap: "0",
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: "0 20px",
          overflowX: "auto",
        }}
      >
        {[
          { to: "/", label: "Dashboard" },
          { to: "/accounts", label: "Accounts" },
          { to: "/simulator", label: "Simulator" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 500,
              color: item.to === "/" ? theme.colors.accent : theme.colors.textMuted,
              borderBottom: item.to === "/" ? `2px solid ${theme.colors.accent}` : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main
        style={{
          padding: "24px 20px",
          maxWidth: "680px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {loading && (
          <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>Loading…</p>
        )}

        {error && (
          <Card>
            <p style={{ color: theme.colors.warning, fontSize: "14px" }}>{error}</p>
          </Card>
        )}

        {data && (
          <>
            <DebtFreeCountdown
              debtFreeDate={data.debt_free_date}
              daysUntil={data.days_until_debt_free}
              totalDebt={Number(data.total_current_debt)}
            />

            <DebtProgressList debts={data.debt_progress} />

            {/* Interest saved */}
            <Card>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Interest saved vs minimums
              </p>
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: theme.colors.positive,
                  lineHeight: 1,
                }}
              >
                {formatCurrency(Number(data.interest_saved))}
              </p>
            </Card>

            <TrendChart trend={data.trend} />

            <StreakBadges streaks={data.streaks} />

            {/* Quick actions */}
            <Card>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "14px",
                }}
              >
                Quick actions
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  loading={refreshing}
                  size="sm"
                >
                  Refresh data
                </Button>
                <Link
                  to="/simulator"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: theme.colors.accent,
                    border: `1px solid rgba(56,189,248,0.3)`,
                    borderRadius: theme.radius.sm,
                    background: "rgba(56,189,248,0.08)",
                  }}
                >
                  Open Simulator
                </Link>
              </div>
              {refreshMsg && (
                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    color: theme.colors.textMuted,
                  }}
                >
                  {refreshMsg}
                </p>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
