import React, { useMemo, useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Cell, BarChart, AreaChart, Area } from "recharts";
import { AppShell } from "../components/ui/AppChrome";
import { Panel } from "../components/ui/Panel";
import { StatTile } from "../components/ui/StatTile";
import { Numeral } from "../components/ui/Stat";
import { useSpending } from "../hooks/useSpending";
import { useGamification } from "../hooks/useGamification";
import { blendedApr, project } from "../lib/whatif";
import { money, monthsToText } from "../lib/format";

const PALETTE = ["#a78bfa", "#5eead4", "#fbbf24", "#38bdf8", "#fb7185", "#2dd4bf", "#c084fc"];
const GREY = "#6b7186";
const axis = { fill: "var(--text-muted)", fontSize: 11 };
const tip = {
  contentStyle: { background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)", borderRadius: 10, color: "var(--text-strong)", fontSize: 12.5 },
  labelStyle: { color: "var(--text-muted)" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};
const compact = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`);
const monthLabel = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short" });

export function SpendingPage() {
  const { data, loading, error } = useSpending(6);
  const { data: gam } = useGamification();
  const [cuts, setCuts] = useState<Record<string, number>>({});

  const done = useMemo(() => (data ? data.months.filter((m) => !m.partial) : []), [data]);
  const last3 = done.slice(-3);
  const avg = (f: (m: (typeof done)[number]) => number) => (last3.length ? last3.reduce((a, m) => a + f(m), 0) / last3.length : 0);
  const avgSpend = avg((m) => m.spend);
  const avgIncome = avg((m) => m.income);
  const avgBorrow = avg((m) => m.borrowing);

  const named = useMemo(() => (data ? data.categories.filter((c) => c.name !== "Uncategorized") : []), [data]);
  const top = named.slice(0, 7);
  const colorOf = (name: string) => {
    const i = top.findIndex((c) => c.name === name);
    return i >= 0 ? PALETTE[i] : GREY;
  };

  const stack = useMemo(() => {
    if (!data) return [];
    return data.months.map((m) => {
      const row: Record<string, number | string> = { label: monthLabel(m.month) + (m.partial ? "*" : ""), income: m.income };
      let other = 0;
      for (const c of data.categories) {
        const v = c.by_month[m.month] ?? 0;
        if (top.some((t) => t.name === c.name)) row[c.name] = v;
        else other += v;
      }
      row["Other"] = other;
      return row;
    });
  }, [data, top]);

  // What-if: cut % per category -> monthly savings -> projected card debt
  const cards = (gam?.debt_progress ?? []).filter((d) => d.account_type === "credit_card" && d.apr != null);
  const cardBalance = cards.reduce((a, d) => a + Number(d.current_balance), 0);
  const apr = blendedApr(cards.map((d) => ({ balance: Number(d.current_balance), apr: Number(d.apr) })));
  const levers = top.slice(0, 6);
  const savings = levers.reduce((a, c) => a + (c.avg_month * (cuts[c.name] ?? 0)) / 100, 0);
  const now = project(cardBalance, apr, avgBorrow, 600);
  const after = project(cardBalance, apr, avgBorrow - savings, 600);
  const horizon = 60;
  const lines = Array.from({ length: horizon + 1 }, (_, i) => ({
    month: i,
    now: now.path[Math.min(i, now.path.length - 1)] ?? 0,
    after: after.path[Math.min(i, after.path.length - 1)] ?? 0,
  }));
  const dateIn = (m: number | null) =>
    m == null ? "Never" : new Date(new Date().getFullYear(), new Date().getMonth() + m, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <AppShell title="Spending" subtitle="Where the money goes, and what you are borrowing to cover it">
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
      {error && <Panel><p style={{ color: "var(--attention)" }}>{error}</p></Panel>}
      {data && done.length === 0 && (
        <Panel><p style={{ color: "var(--text-muted)", fontSize: 14 }}>No spending yet. Connect Sure in Settings and sync.</p></Panel>
      )}

      {data && done.length > 0 && (
        <div className="grid-12">
          <StatTile className="span-3" label="Spending / month" value={money(avgSpend)} sub="average, last 3 full months" />
          <StatTile className="span-3" label="Income / month" value={money(avgIncome)} tone="positive" sub="paychecks and deposits" />
          <StatTile
            className="span-3"
            label="Borrowing / month"
            value={`${avgBorrow > 0 ? "+" : ""}${money(avgBorrow)}`}
            tone={avgBorrow > 0 ? "attention" : "positive"}
            sub={avgBorrow > 0 ? "card balances grow from spending" : "you pay down more than you charge"}
          />
          <StatTile
            className="span-3"
            label="Uncategorized"
            value={`${Math.round(data.uncategorized_share * 100)}%`}
            tone={data.uncategorized_share > 0.25 ? "attention" : "positive"}
            sub={data.learned_share > 0 ? `${Math.round(data.learned_share * 100)}% filled in from merchant history` : "of spending has no category"}
          />

          <Panel className="span-8" title="Spending by category" aside="line = income · * month in progress">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={stack} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={48} tickFormatter={compact} />
                <Tooltip {...tip} formatter={(v: number, n: string) => [money(v), n]} />
                {top.map((c, i) => (
                  <Bar key={c.name} dataKey={c.name} stackId="s" fill={PALETTE[i]} isAnimationActive={false} />
                ))}
                <Bar dataKey="Other" stackId="s" fill={GREY} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Line dataKey="income" stroke="var(--text-strong)" strokeDasharray="4 4" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
              {top.map((c, i) => (
                <span key={c.name} style={{ fontSize: 12, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i] }} />
                  {c.name}
                </span>
              ))}
            </div>
          </Panel>

          <Panel className="span-4" title="Borrowing per month" aside="charges − payments">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.months.map((m) => ({ label: monthLabel(m.month) + (m.partial ? "*" : ""), borrowing: m.borrowing }))} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={48} tickFormatter={compact} />
                <Tooltip {...tip} formatter={(v: number) => [money(v), v > 0 ? "Added to cards" : "Paid down"]} />
                <Bar dataKey="borrowing" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.months.map((m) => (
                    <Cell key={m.month} fill={m.borrowing > 0 ? "var(--attention)" : "var(--positive)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel className="span-7" title="Where credit comes from" aside="share of each category put on cards">
            <div className="credit-row" style={{ padding: "0 2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--glass-border)" }}>
              <span>Category</span><span style={{ textAlign: "right" }}>Avg / mo</span><span className="c-bar">On cards</span><span style={{ textAlign: "right" }}>On cards</span>
            </div>
            {[...named].sort((a, b) => b.avg_month * b.card_share - a.avg_month * a.card_share).slice(0, 9).map((c) => (
              <div key={c.name} className="credit-row" style={{ padding: "11px 2px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-strong)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: colorOf(c.name) }} />{c.name}
                </span>
                <Numeral style={{ textAlign: "right", fontSize: 14 }}>{money(c.avg_month)}</Numeral>
                <span className="c-bar">
                  <span style={{ display: "block", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.round(c.card_share * 100)}%`, background: c.card_share > 0.7 ? "var(--attention)" : "var(--data-1)" }} />
                  </span>
                  <Numeral style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, display: "block" }}>{Math.round(c.card_share * 100)}% on cards</Numeral>
                </span>
                <span style={{ textAlign: "right" }}>
                  <Numeral style={{ fontSize: 14, color: "var(--attention)" }}>{money(c.avg_month * c.card_share)}</Numeral>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>{Math.round(c.card_share * 100)}% of it</span>
                </span>
              </div>
            ))}
          </Panel>

          <Panel className="span-5" title="What if I spend less?" aside="drag to try cuts">
            {levers.map((c) => (
              <div key={c.name} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{c.name} <span style={{ color: "var(--text-faint)" }}>({money(c.avg_month)}/mo)</span></span>
                  <Numeral style={{ color: (cuts[c.name] ?? 0) > 0 ? "var(--positive)" : "var(--text-faint)" }}>
                    {(cuts[c.name] ?? 0) > 0 ? `−${cuts[c.name]}% · ${money((c.avg_month * (cuts[c.name] ?? 0)) / 100)}` : "no change"}
                  </Numeral>
                </div>
                <input type="range" min={0} max={100} step={5} value={cuts[c.name] ?? 0}
                  onChange={(e) => setCuts({ ...cuts, [c.name]: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
              </div>
            ))}
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>
              Saves <Numeral style={{ color: "var(--positive)" }}>{money(savings)}</Numeral> a month.
            </p>
            {avgBorrow > 0 && levers.length > 0 && (
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                To stop card balances growing you need to trim about{" "}
                <Numeral style={{ color: "var(--attention)" }}>{money(avgBorrow)}</Numeral> a month, roughly{" "}
                {Math.round((avgBorrow / Math.max(1, levers.reduce((a, c) => a + c.avg_month, 0))) * 100)}% across these categories.
              </p>
            )}
          </Panel>

          <Panel className="span-12" title="Card debt, with and without the cuts" aside={cards.length ? `${money(cardBalance)} on cards · ${apr.toFixed(1)}% blended APR` : undefined}>
            {cards.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Add APRs to your credit cards on the Accounts page to see projections.</p>
            ) : (
              <div className="grid-12">
                <div className="span-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "If nothing changes", p: now, tone: now.monthsToZero == null ? "var(--attention)" : "var(--text-strong)" },
                    { label: "With these cuts", p: after, tone: "var(--positive)" },
                  ].map(({ label, p, tone }) => (
                    <div key={label} className="glass" style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                      <Numeral as="p" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, color: tone }}>
                        {p.monthsToZero == null ? "Never pays off" : dateIn(p.monthsToZero)}
                      </Numeral>
                      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>
                        {p.monthsToZero == null
                          ? `balances reach ${money(p.path[Math.min(12, p.path.length - 1)])} in a year`
                          : `${monthsToText(p.monthsToZero)} · ${money(p.interestPaid)} interest`}
                      </p>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
                    Assumes the last 3 full months repeat: {avgBorrow > 0 ? "+" : ""}{money(avgBorrow)}/month net borrowing, one blended APR.
                  </p>
                </div>
                <div className="span-8">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={lines} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} minTickGap={30} tickFormatter={(m) => (m % 12 === 0 ? `${m / 12}y` : `${m}m`)} />
                      <YAxis tick={axis} axisLine={false} tickLine={false} width={52} tickFormatter={compact} />
                      <Tooltip {...tip} formatter={(v: number, n: string) => [money(v), n === "now" ? "If nothing changes" : "With cuts"]} labelFormatter={(m) => `Month ${m}`} />
                      <Area dataKey="now" stroke="var(--attention)" strokeWidth={2} fill="none" dot={false} isAnimationActive={false} />
                      <Area dataKey="after" stroke="var(--positive)" strokeWidth={2} fill="var(--positive-tint)" dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Panel>

          {data.top_uncategorized_merchants.length > 0 && (
            <Panel className="span-12" title="Needs a category" aside="biggest uncategorized merchants. Set rules in Sure to fix them for good">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {data.top_uncategorized_merchants.map((m) => (
                  <span key={m.merchant} className="glass" style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)", borderRadius: 999 }}>
                    {m.merchant} <Numeral style={{ color: "var(--text-muted)", marginLeft: 6 }}>{money(m.total)}</Numeral>
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </AppShell>
  );
}
