import React, { useEffect, useMemo, useState } from "react";
import { simulate } from "@sovi/payoff";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useGamification } from "../hooks/useGamification";
import { api } from "../api/client";
import { AppShell } from "../components/ui/AppChrome";
import { Panel } from "../components/ui/Panel";
import { Numeral } from "../components/ui/Stat";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { money, monthsToText } from "../lib/format";
import { METHODS, orderFor, run, toPlanDebts, type MethodId } from "../lib/methods";

const axis = { fill: "var(--text-muted)", fontSize: 11 };
const compact = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`);
/** One tick per 1, 2, 5 or 10 years, whichever keeps the axis to about 6 labels. */
function yearTicks(maxMonth: number): number[] {
  const years = Math.max(1, Math.ceil(maxMonth / 12));
  const step = [1, 2, 5, 10, 20].find((s) => years / s <= 6) ?? 20;
  return Array.from({ length: Math.floor(years / step) + 1 }, (_, i) => i * step * 12);
}
const dateIn = (m: number | null) =>
  m == null ? "Not within 50 years" : new Date(new Date().getFullYear(), new Date().getMonth() + m, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export function SimulatorPage() {
  const { data: gam, loading } = useGamification();
  const [extra, setExtra] = useState(200);
  const [method, setMethod] = useState<MethodId>("avalanche");
  const [custom, setCustom] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const debts = useMemo(() => toPlanDebts(gam?.debt_progress ?? []), [gam]);
  const byId = useMemo(() => Object.fromEntries(debts.map((d) => [d.id, d])), [debts]);

  // Start the custom order from the avalanche order the first time it is needed.
  useEffect(() => {
    if (debts.length && custom.length === 0) setCustom(orderFor("avalanche", debts, []));
  }, [debts, custom.length]);

  const runs = useMemo(
    () => (debts.length ? METHODS.map((m) => run(m.id, debts, extra, custom)) : []),
    [debts, extra, custom]
  );
  const baseline = useMemo(() => (debts.length ? simulate({ debts: debts.map((d) => d.debt), extraMonthly: 0, strategy: "avalanche" }) : null), [debts]);
  const current = runs.find((r) => r.method === method);
  const meta = METHODS.find((m) => m.id === method)!;

  const finite = runs.filter((r) => !r.result.hitHorizon);
  const cheapest = finite.length ? finite.reduce((a, b) => (b.result.totalInterest < a.result.totalInterest ? b : a)).method : null;
  const quickestWin =
    runs.filter((r) => r.firstWinMonth != null).reduce<(typeof runs)[number] | null>((a, b) => (a == null || (b.firstWinMonth ?? 1e9) < (a.firstWinMonth ?? 1e9) ? b : a), null)?.method ?? null;
  const fastest = finite.length ? finite.reduce((a, b) => (b.result.totalMonths < a.result.totalMonths ? b : a)).method : null;

  const totalMin = debts.reduce((a, d) => a + d.minPayment, 0);
  const month1 = current?.result.schedule[0]?.payments ?? {};
  const maxMonth = Math.max(1, ...(current?.result.debtResults.map((r) => r.payoffMonth ?? current.result.totalMonths) ?? [1]));

  const timeline = useMemo(() => {
    if (!current || !baseline) return [];
    const tot = (b: Record<string, number>) => Object.values(b).reduce((a, v) => a + v, 0);
    const start = debts.reduce((a, d) => a + d.balance, 0);
    const len = Math.max(current.result.schedule.length, baseline.schedule.length);
    const out = [{ month: 0, plan: start, minimums: start }];
    for (let i = 0; i < len; i++) {
      const p = current.result.schedule[i];
      const m = baseline.schedule[i];
      out.push({ month: i + 1, plan: p ? tot(p.balances) : 0, minimums: m ? tot(m.balances) : 0 });
    }
    return out;
  }, [current, baseline, debts]);

  const move = (id: string, dir: -1 | 1) => {
    const order = orderFor("custom", debts, method === "custom" ? custom : current?.order ?? custom);
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    setCustom(order);
    setMethod("custom");
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const strategy = method === "avalanche" || method === "snowball" ? method : "custom";
      await api.post("/scenarios", {
        name: `${meta.name} +$${extra}/mo`,
        strategy,
        extra_monthly: extra,
        custom_order: strategy === "custom" ? current.order : null,
      });
      setSaveMsg("Saved. The dashboard now follows this plan.");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const head: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" };
  const muted: React.CSSProperties = { fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 };
  const body: React.CSSProperties = { ...muted, color: "var(--text-secondary)", marginTop: 4 };

  return (
    <AppShell title="Payoff plan" subtitle="Pick a method, see exactly which debt gets your next dollar, and what it costs">
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
      {!loading && debts.length === 0 && (
        <Panel>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No debts with an APR yet. Add the details on the Accounts page.</p>
        </Panel>
      )}

      {debts.length > 0 && current && baseline && (
        <div className="grid-12">
          <Panel className="span-4" title="Your budget for debt">
            <p style={muted}>Minimums on all your debts</p>
            <Numeral as="p" style={{ fontSize: 24, fontWeight: 600, color: "var(--text-strong)", marginTop: 2 }}>{money(totalMin, 2)}</Numeral>
            <p style={{ ...muted, marginTop: 16 }}>Extra on top, each month</p>
            <Numeral as="p" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.05, color: "var(--positive)", marginTop: 2 }}>{money(extra)}</Numeral>
            <input type="range" min={0} max={2000} step={25} value={extra} onChange={(e) => setExtra(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)", marginTop: 12 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}><span>$0</span><span>$2,000</span></div>
            <div className="glass" style={{ padding: "12px 14px", marginTop: 18 }}>
              <p style={head}>Total to pay each month</p>
              <Numeral as="p" style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{money(totalMin + extra, 2)}</Numeral>
            </div>
            <p style={{ ...muted, fontSize: 12, marginTop: 14 }}>
              Minimums only: debt-free {dateIn(baseline.hitHorizon ? null : baseline.totalMonths)}, {money(baseline.totalInterest)} interest.
            </p>
          </Panel>

          <Panel className="span-8" title="Compare the methods" aside={`same ${money(extra)} extra for each`}>
            <div>
              <div>
                <div className="cmp-row" style={{ paddingBottom: 8, borderBottom: "1px solid var(--glass-border)" }}>
                  <span style={head}>Method</span><span className="c-focus" style={head}>Focus first</span>
                  <span style={{ ...head, textAlign: "right" }}>Debt-free</span><span style={{ ...head, textAlign: "right" }}>Interest</span><span className="c-win" style={{ ...head, textAlign: "right" }}>First win</span>
                </div>
                {runs.map((r) => {
                  const m = METHODS.find((x) => x.id === r.method)!;
                  const active = r.method === method;
                  const first = byId[r.order[0]];
                  return (
                    <div
                      key={r.method}
                      onClick={() => setMethod(r.method)}
                      className="cmp-row"
                      style={{
                        padding: "12px 8px", margin: "0 -8px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", borderRadius: 10,
                        background: active ? "rgba(255,255,255,0.06)" : "transparent", boxShadow: active ? "inset 2px 0 0 var(--accent)" : "none",
                      }}
                    >
                      <span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)" }}>{m.name}</span>
                        <span style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                          {cheapest === r.method && <Badge variant="positive">Cheapest</Badge>}
                          {fastest === r.method && <Badge variant="accent">Fastest</Badge>}
                          {quickestWin === r.method && <Badge variant="warning">Quickest win</Badge>}
                        </span>
                        <span className="c-focus-inline">Focus: {first?.name}</span>
                      </span>
                      <span className="c-focus" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {first?.name}
                        {r.method !== "avalanche" && r.order.join() === runs[0].order.join() && (
                          <span style={{ display: "block", fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>same order as Avalanche</span>
                        )}
                      </span>
                      <Numeral style={{ textAlign: "right", fontSize: 13.5 }}>{r.result.hitHorizon ? "never" : dateIn(r.result.totalMonths)}</Numeral>
                      <Numeral style={{ textAlign: "right", fontSize: 13.5, color: "var(--attention)" }}>{money(r.result.totalInterest)}</Numeral>
                      <span className="c-win" style={{ textAlign: "right" }}><Numeral style={{ fontSize: 13.5 }}>{r.firstWinMonth != null ? monthsToText(r.firstWinMonth) : "n/a"}</Numeral></span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p style={{ ...muted, fontSize: 12, marginTop: 12 }}>Click a method to see its plan below. "First win" is how long until your first debt is completely gone.</p>
          </Panel>

          <Panel className="span-5" title={`${meta.name}: ${meta.tagline}`}>
            <p style={head}>How it works</p>
            <p style={body}>{meta.how}</p>
            <p style={{ ...head, marginTop: 14 }}>Why people choose it</p>
            <p style={body}>{meta.why}</p>
            <p style={{ ...head, marginTop: 14 }}>The catch</p>
            <p style={body}>{meta.tradeoff}</p>
            <p style={{ ...head, marginTop: 14 }}>Best when</p>
            <p style={body}>{meta.bestWhen}</p>
            {method === "custom" && <p style={{ ...muted, color: "var(--accent)", marginTop: 14 }}>Use the arrows in the plan to change the order.</p>}
          </Panel>

          <Panel className="span-7" title="Your plan this month" aside={`${meta.name} · pay ${money(totalMin + extra, 2)} in total`}>
            {current.order.map((id, i) => {
              const d = byId[id];
              if (!d) return null;
              const res = current.result.debtResults.find((r) => r.id === id);
              const pay = month1[id] ?? 0;
              const isFocus = i === 0;
              return (
                <div
                  key={id}
                  className="plan-row"
                  style={{
                    padding: "13px 10px", margin: "0 -10px", borderRadius: 12,
                    background: isFocus ? "rgba(94,234,212,0.07)" : "transparent",
                    border: isFocus ? "1px solid rgba(94,234,212,0.22)" : "1px solid transparent",
                    borderBottom: isFocus ? undefined : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="c-rank" style={{ width: 26, height: 26, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, background: isFocus ? "var(--positive)" : "rgba(255,255,255,0.08)", color: isFocus ? "#06231f" : "var(--text-secondary)" }}>{i + 1}</span>
                  <span className="c-name">
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)" }}>{d.name}</span>
                    {isFocus && <span style={{ display: "block", fontSize: 11.5, color: "var(--positive)", marginTop: 3 }}>Focus: extra money goes here</span>}
                    {d.limit != null && <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{Math.round((d.balance / d.limit) * 100)}% of {money(d.limit)} limit</span>}
                  </span>
                  <span className="c-bal">
                    <Numeral style={{ fontSize: 13.5 }}>{money(d.balance)}</Numeral>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)" }}>{d.apr.toFixed(2)}% APR</span>
                  </span>
                  <span className="c-min">
                    <span style={{ ...head, display: "block", fontSize: 10 }}>Minimum</span>
                    <Numeral style={{ fontSize: 13.5 }}>{money(d.minPayment, 2)}</Numeral>
                  </span>
                  <span className="c-pay">
                    <span style={{ ...head, display: "block", fontSize: 10 }}>Pay now</span>
                    <Numeral style={{ fontSize: 15, fontWeight: 600, color: isFocus ? "var(--positive)" : "var(--text-strong)" }}>{money(pay, 2)}</Numeral>
                  </span>
                  <span className="c-gone" style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <span style={{ textAlign: "right" }}>
                      <span style={{ ...head, display: "block", fontSize: 10 }}>Gone by</span>
                      <Numeral style={{ fontSize: 13, whiteSpace: "nowrap" }}>{dateIn(res?.payoffMonth ?? null)}</Numeral>
                    </span>
                    {method === "custom" && (
                      <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                        <button onClick={() => move(id, -1)} aria-label="Move up" style={arrow}>▲</button>
                        <button onClick={() => move(id, 1)} aria-label="Move down" style={arrow}>▼</button>
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
              <Button onClick={save} loading={saving} variant="secondary" size="sm">Use this plan on the dashboard</Button>
              {method !== "custom" && (
                <Button size="sm" variant="ghost" onClick={() => { setCustom(current.order); setMethod("custom"); }}>Customise this order</Button>
              )}
              {saveMsg && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{saveMsg}</span>}
            </div>
          </Panel>

          <Panel className="span-7" title="Total owed over time" aside={`${meta.name} vs minimums only`}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeline} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" type="number" domain={[0, "dataMax"]} ticks={yearTicks(timeline.length - 1)} tick={axis} axisLine={false} tickLine={false} tickFormatter={(m) => (m === 0 ? "now" : `${m / 12}y`)} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={52} tickFormatter={compact} />
                <Tooltip
                  contentStyle={{ background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)", borderRadius: 10, color: "var(--text-strong)", fontSize: 12.5 }}
                  formatter={(v: number, n: string) => [money(v), n === "plan" ? meta.name : "Minimums only"]}
                  labelFormatter={(m) => `Month ${m}`}
                />
                <Area type="monotone" dataKey="minimums" stroke="var(--text-faint)" strokeDasharray="4 4" strokeWidth={1.5} fill="none" dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="plan" stroke="var(--positive)" strokeWidth={2} fill="url(#planGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel className="span-5" title="When each debt disappears" aside="rolling the payments down">
            {current.order.map((id, i) => {
              const d = byId[id];
              const res = current.result.debtResults.find((r) => r.id === id);
              const m = res?.payoffMonth ?? null;
              const pct = ((m ?? maxMonth) / maxMonth) * 100;
              return (
                <div key={id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{i + 1}. {d?.name}</span>
                    <Numeral style={{ color: "var(--text-muted)" }}>{m == null ? "never" : `${monthsToText(m)} · ${dateIn(m)}`}</Numeral>
                  </div>
                  <span style={{ display: "block", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: 4, background: m == null ? "var(--attention)" : i === 0 ? "var(--positive)" : "var(--data-1)" }} />
                  </span>
                </div>
              );
            })}
            <p style={{ ...muted, fontSize: 12, marginTop: 6 }}>
              When a debt is paid off, its whole payment (minimum plus extra) rolls onto the next one on the list. That is why the later bars shorten.
            </p>
          </Panel>

          <div className="span-12">
            <Panel title="Other ways to speed this up" aside="not modelled yet">
              <div className="grid-12" style={{ gap: 16 }}>
                {[
                  ["Windfalls (snowflakes)", "Tax refund, bonus, sold item: one-off money straight onto the focus debt. Often the biggest single jump."],
                  ["Balance transfer", "Move a high-APR card to a 0% promotional offer. Worth it only if the fee is small and you can pay it off before the promo ends."],
                  ["Consolidation loan", "One lower-rate fixed loan replaces several cards. It helps only if the rate is clearly lower and you stop running the cards back up."],
                  ["Negotiate the APR", "A call to your card issuer asking for a lower rate costs nothing and sometimes works, especially with a good payment history."],
                ].map(([t, d]) => (
                  <div key={t} className="span-3 glass" style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-strong)" }}>{t}</p>
                    <p style={{ ...muted, fontSize: 12.5, marginTop: 6 }}>{d}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const arrow: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)", color: "var(--text-muted)",
  borderRadius: 5, fontSize: 9, lineHeight: 1, padding: "3px 6px", cursor: "pointer",
};
