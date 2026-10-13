import React, { useState, useMemo } from "react";
import { simulate, simulateSideBySide } from "@sovi/payoff";
import type { Debt, Strategy } from "@sovi/payoff";
import { useGamification } from "../hooks/useGamification";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Numeral } from "../components/ui/Stat";
import { Panel } from "../components/ui/Panel";
import { StatTile } from "../components/ui/StatTile";
import { AppShell } from "../components/ui/AppChrome";
import { money, monthsToText } from "../lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { theme } from "../theme";

type ViewStrategy = "avalanche" | "snowball" | "side-by-side";

const formatCurrency = (n: number) => money(n);

function formatDate(d: Date | null): string {
  if (!d) return "Beyond 50 years";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function SimulatorPage() {
  const { data: gamData, loading } = useGamification();
  const [extra, setExtra] = useState(0);
  const [extraInput, setExtraInput] = useState("0");
  const [strategy, setStrategy] = useState<ViewStrategy>("avalanche");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Build payoff Debt array from gamification data
  const debts: Debt[] = useMemo(() => {
    if (!gamData) return [];
    return gamData.debt_progress
      .filter((d) => d.apr !== null && d.current_balance > 0)
      .map((d) => ({
        id: d.account_id,
        balance: Number(d.current_balance),
        apr: Number(d.apr),
        minPaymentType: (d.min_payment_type ?? "percent") as "fixed" | "percent",
        minPaymentValue: Number(d.min_payment_value ?? 1),
        minPaymentFloor: d.min_payment_floor != null ? Number(d.min_payment_floor) : 25,
      }));
  }, [gamData]);

  // Instant client-side simulation
  const result = useMemo(() => {
    if (debts.length === 0) return null;
    if (strategy === "side-by-side") {
      return simulateSideBySide(debts, extra);
    }
    return simulate({ debts, extraMonthly: extra, strategy: strategy as Strategy });
  }, [debts, extra, strategy]);

  // Baseline (minimums only)
  const baseline = useMemo(() => {
    if (debts.length === 0) return null;
    return simulate({ debts, extraMonthly: 0, strategy: "avalanche" });
  }, [debts]);

  const handleSlider = (v: number) => {
    setExtra(v);
    setExtraInput(String(v));
  };

  const handleInputChange = (v: string) => {
    setExtraInput(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0) setExtra(n);
  };

  const handleSave = async () => {
    if (!result || strategy === "side-by-side") return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.post("/scenarios", {
        name: `${strategy} +$${extra}/mo`,
        strategy,
        extra_monthly: extra,
      });
      setSaveMsg("Scenario saved.");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const isSideBySide = strategy === "side-by-side";
  const sideBySideResult = isSideBySide ? (result as ReturnType<typeof simulateSideBySide>) : null;
  const singleResult = !isSideBySide ? (result as ReturnType<typeof simulate>) : null;

  const monthsSaved =
    singleResult && baseline ? Math.max(0, baseline.totalMonths - singleResult.totalMonths) : 0;
  const interestSaved = singleResult && baseline ? Math.max(0, baseline.totalInterest - singleResult.totalInterest) : 0;

  // Total owed per month: this plan vs minimums only
  const timeline = useMemo(() => {
    if (!singleResult || !baseline) return [];
    const total = (b: Record<string, number>) => Object.values(b).reduce((a, v) => a + v, 0);
    const start = debts.reduce((a, d) => a + d.balance, 0);
    const len = Math.max(singleResult.schedule.length, baseline.schedule.length);
    const out = [{ month: 0, plan: start, minimums: start }];
    for (let i = 0; i < len; i++) {
      const p = singleResult.schedule[i];
      const m = baseline.schedule[i];
      out.push({ month: i + 1, plan: p ? total(p.balances) : 0, minimums: m ? total(m.balances) : 0 });
    }
    return out;
  }, [singleResult, baseline, debts]);

  const strategyTabs = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {(["avalanche", "snowball", "side-by-side"] as ViewStrategy[]).map((s) => {
        const active = strategy === s;
        return (
          <button
            key={s}
            onClick={() => setStrategy(s)}
            style={{
              padding: "7px 14px", fontSize: 13, fontWeight: 500, fontFamily: theme.fonts.sans,
              borderRadius: 999, cursor: "pointer",
              border: `1px solid ${active ? "var(--glass-border-top)" : "var(--glass-border)"}`,
              background: active ? "rgba(255,255,255,0.09)" : "transparent",
              color: active ? "var(--text-strong)" : "var(--text-muted)",
              boxShadow: active ? "inset 0 -2px 0 var(--accent)" : "none",
            }}
          >
            {s === "side-by-side" ? "Side-by-side" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell title="Simulator" subtitle="Try an extra monthly payment and compare payoff strategies">
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
      {!loading && debts.length === 0 && (
        <Panel>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No debts with an APR yet. Add the details on the Accounts page.
          </p>
        </Panel>
      )}

      {!loading && debts.length > 0 && (
        <div className="grid-12">
          <Panel className="span-4" title="Plan">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10 }}>Extra per month</p>
            <Numeral as="p" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1, color: "var(--text-strong)", marginBottom: 14 }}>
              {formatCurrency(extra)}
            </Numeral>
            <input
              type="range" min={0} max={2000} step={25} value={extra}
              onChange={(e) => handleSlider(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
              <span>$0</span><span>$2,000</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
              Exact amount
              <input
                type="number" min={0} value={extraInput}
                onChange={(e) => handleInputChange(e.target.value)}
                style={{ width: 96, background: "var(--surface-input)", border: "1px solid var(--glass-border)", borderRadius: 8, padding: "6px 10px", color: "var(--text-strong)", fontFamily: theme.fonts.mono, fontSize: 13 }}
              />
            </label>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "20px 0 8px" }}>Strategy</p>
            {strategyTabs}
            {singleResult && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 22 }}>
                <Button onClick={handleSave} loading={saving} variant="secondary" size="sm">Save scenario</Button>
                {saveMsg && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{saveMsg}</span>}
              </div>
            )}
          </Panel>

          <div className="span-8" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {singleResult && (
              <>
                <div className="grid-12" style={{ gap: 16 }}>
                  <StatTile className="span-4" label="Debt-free" value={formatDate(singleResult.debtFreeDate)} sub={monthsToText(singleResult.totalMonths)} />
                  <StatTile className="span-4" label="Total interest" value={formatCurrency(singleResult.totalInterest)} tone="attention" />
                  <StatTile
                    className="span-4"
                    label="Saved vs minimums"
                    value={formatCurrency(interestSaved)}
                    tone="positive"
                    sub={monthsSaved > 0 ? `${monthsToText(monthsSaved)} sooner` : "add an extra payment to see savings"}
                  />
                </div>

                <Panel title="Total owed over time" aside="plan vs minimums only">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timeline} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40}
                        tickFormatter={(m) => (m % 12 === 0 ? `${m / 12}y` : `${m}m`)} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={52}
                        tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`)} />
                      <Tooltip
                        contentStyle={{ background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)", borderRadius: 10, color: "var(--text-strong)", fontSize: 12.5 }}
                        formatter={(v: number, n: string) => [formatCurrency(v), n === "plan" ? "With plan" : "Minimums only"]}
                        labelFormatter={(m) => `Month ${m}`}
                      />
                      <Area type="monotone" dataKey="minimums" stroke="var(--text-faint)" strokeDasharray="4 4" strokeWidth={1.5} fill="none" dot={false} />
                      <Area type="monotone" dataKey="plan" stroke="var(--positive)" strokeWidth={2} fill="url(#planGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Panel>

                {singleResult.warnings.length > 0 && (
                  <Panel>
                    {singleResult.warnings.map((w, i) => (
                      <p key={i} style={{ fontSize: 13, color: "var(--attention)" }}>{w}</p>
                    ))}
                  </Panel>
                )}
              </>
            )}

            {sideBySideResult && (
              <>
                <div className="grid-12" style={{ gap: 16 }}>
                  {(
                    [
                      { key: "avalanche", label: "Avalanche", r: sideBySideResult.avalanche },
                      { key: "snowball", label: "Snowball", r: sideBySideResult.snowball },
                    ] as const
                  ).map(({ key, label, r }) => (
                    <StatTile key={key} className="span-6" label={label} value={formatDate(r.debtFreeDate)} sub={`${formatCurrency(r.totalInterest)} interest`} />
                  ))}
                </div>
                {(sideBySideResult.monthsDelta !== 0 || sideBySideResult.interestDelta !== 0) && (
                  <Panel>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                      Avalanche is{" "}
                      <span style={{ color: "var(--positive)", fontWeight: 600 }}>{monthsToText(Math.abs(sideBySideResult.monthsDelta))} faster</span> and saves{" "}
                      <span style={{ color: "var(--positive)", fontWeight: 600 }}>{formatCurrency(Math.abs(sideBySideResult.interestDelta))}</span> in interest vs snowball.
                    </p>
                  </Panel>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
