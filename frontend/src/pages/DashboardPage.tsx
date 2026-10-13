import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../hooks/useGamification";
import { api } from "../api/client";
import { TrendChart } from "../components/TrendChart";
import { StreakBadges } from "../components/StreakBadges";
import { DebtTable } from "../components/DebtTable";
import { Panel } from "../components/ui/Panel";
import { StatTile } from "../components/ui/StatTile";
import { Numeral } from "../components/ui/Stat";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { AppShell } from "../components/ui/AppChrome";
import { money, longDate } from "../lib/format";

export function DashboardPage() {
  const { data, loading, error, refresh } = useGamification();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      // Sure is the primary source; fall back to SimpleFIN if Sure is not connected.
      try {
        await api.post("/sure/refresh");
      } catch {
        await api.post("/simplefin/refresh");
      }
      setRefreshMsg("Sync queued");
      setTimeout(() => refresh(), 3000);
    } catch (err) {
      setRefreshMsg(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const actions = (
    <>
      {refreshMsg && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{refreshMsg}</span>}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRefresh}
        loading={refreshing}
        iconLeft={<Icon name="refresh" size={15} style={{ animation: refreshing ? "sovi-spin 0.9s linear infinite" : undefined }} />}
      >
        Refresh
      </Button>
      <Link to="/simulator" className="glass is-interactive" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 500, color: "var(--text-strong)", borderRadius: "var(--radius-sm)" }}>
        <Icon name="sliders" size={15} />
        Payoff plan
      </Link>
    </>
  );

  const debts = data?.debt_progress ?? [];
  const owed = Number(data?.total_current_debt ?? 0);
  const monthlyInterest = debts.reduce((a, d) => a + Number(d.monthly_interest ?? 0), 0);
  const cards = debts.filter((d) => d.credit_limit != null && d.utilization_pct != null);
  const limitTotal = cards.reduce((a, d) => a + Number(d.credit_limit), 0);
  const cardOwed = cards.reduce((a, d) => a + Number(d.current_balance), 0);
  const utilPct = limitTotal > 0 ? (cardOwed / limitTotal) * 100 : null;
  const months = data?.days_until_debt_free != null ? Math.round(data.days_until_debt_free / 30.4) : null;
  const years = months != null ? months / 12 : null;

  return (
    <AppShell title="Dashboard" subtitle={debts.length ? `${debts.length} debt${debts.length === 1 ? "" : "s"} tracked` : undefined} actions={actions}>
      {loading && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</p>}
      {error && <Panel><p style={{ color: "var(--attention)", fontSize: 14 }}>{error}</p></Panel>}

      {data && (
        <div className="grid-12">
          <StatTile className="span-3" label="Total owed" value={money(owed)} sub={`${debts.length} account${debts.length === 1 ? "" : "s"}`} />
          <StatTile className="span-3" label="Interest per month" value={money(monthlyInterest)} tone="attention" sub="at current balances and APRs" />
          <StatTile
            className="span-3"
            label="Card utilization"
            value={utilPct != null ? `${utilPct.toFixed(0)}%` : "n/a"}
            tone={utilPct != null && utilPct >= 30 ? "attention" : "positive"}
            sub={utilPct != null ? `${money(cardOwed)} of ${money(limitTotal)} limit` : "set credit limits on Accounts"}
          />
          <StatTile className="span-3" label="Interest saved" value={money(Number(data.interest_saved))} tone="positive" sub="vs paying minimums only" />

          <Panel className="span-4" title="Debt-free in">
            {months != null && data.debt_free_date ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <Numeral style={{ fontSize: 64, fontWeight: 600, lineHeight: 1, color: "var(--text-strong)" }}>
                    {years != null && years >= 2 ? years.toFixed(1) : months}
                  </Numeral>
                  <span style={{ fontSize: 18, color: "var(--text-muted)" }}>{years != null && years >= 2 ? "years" : "months"}</span>
                </div>
                <p style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13.5 }}>
                  <Icon name="calendar" size={15} />
                  <Numeral>{longDate(data.debt_free_date)}</Numeral>
                </p>
                <p style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 12.5 }}>
                  {money(owed)} remaining · avalanche plan
                </p>
              </>
            ) : debts.length > 0 ? (
              <>
                <p style={{ color: "var(--text-strong)", fontSize: 16, fontWeight: 500 }}>Not at minimum payments</p>
                <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>
                  At the minimums you set, at least one debt never pays off within 50 years. Try an extra monthly payment in the Simulator.
                </p>
              </>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Add a debt with an APR to see your payoff date.</p>
            )}
          </Panel>

          <div className="span-8" style={{ display: "contents" }}>
            <TrendChart trend={data.trend} className="span-8" />
          </div>

          <Panel className="span-12" title="Debts" aside="sorted by APR">
            <DebtTable debts={debts} />
          </Panel>

          {data.streaks.length > 0 && (
            <div className="span-12">
              <StreakBadges streaks={data.streaks} />
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
