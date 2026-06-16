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
import { Eyebrow, StatBlock } from "../components/ui/Stat";
import { Icon } from "../components/ui/Icon";
import { AppHeader, TabNav } from "../components/ui/AppChrome";
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
      <AppHeader>
        <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>{user?.email}</span>
        <Link
          to="/settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: theme.colors.textMuted,
            padding: "5px 10px",
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
          }}
        >
          <Icon name="settings" size={15} />
          Settings
        </Link>
      </AppHeader>

      <TabNav />

      <main
        style={{
          padding: "24px",
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

            {/* Interest saved — eyebrow + big mono numeral. */}
            <Card>
              <StatBlock
                label="Interest saved vs minimums"
                value={formatCurrency(Number(data.interest_saved))}
                size="md"
                tone="positive"
              />
            </Card>

            <TrendChart trend={data.trend} />

            <StreakBadges streaks={data.streaks} />

            {/* Quick actions */}
            <Card>
              <Eyebrow style={{ marginBottom: "14px" }}>Quick actions</Eyebrow>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  loading={refreshing}
                  size="sm"
                  iconLeft={
                    <Icon
                      name="refresh"
                      size={15}
                      style={{ animation: refreshing ? "sovi-spin 0.9s linear infinite" : undefined }}
                    />
                  }
                >
                  Refresh data
                </Button>
                <Link
                  to="/simulator"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: theme.colors.accent,
                    border: `1px solid ${theme.colors.accentTintBorder}`,
                    borderRadius: theme.radius.sm,
                    background: theme.colors.accentTint,
                  }}
                >
                  <Icon name="sliders" size={15} />
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
