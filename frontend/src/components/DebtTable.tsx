import React from "react";
import { Numeral } from "./ui/Stat";
import { money, monthsToText } from "../lib/format";
import type { DebtProgress } from "../hooks/useGamification";

function minPayment(d: DebtProgress): number | null {
  if (d.min_payment_value == null) return null;
  const v = Number(d.min_payment_value);
  const bal = Number(d.current_balance);
  if (d.min_payment_type === "fixed") return Math.min(v, bal);
  if (d.min_payment_type === "interest_plus_percent") {
    const due = Number(d.monthly_interest ?? 0) + (bal * v) / 100;
    return Math.min(Math.max(due, Number(d.min_payment_floor ?? 0)), bal);
  }
  const pct = (bal * v) / 100;
  return Math.min(Math.max(pct, Number(d.min_payment_floor ?? 0)), bal);
}

function utilColor(pct: number): string {
  if (pct >= 70) return "var(--attention)";
  if (pct >= 30) return "var(--data-1)";
  return "var(--positive)";
}

const COLS = "minmax(180px, 2.2fr) 1fr minmax(150px, 1.6fr) 0.8fr 1fr 1fr 1fr";

/** Dense debt table (laptop). Collapses to stacked rows on narrow screens via the grid's min widths. */
export function DebtTable({ debts }: { debts: DebtProgress[] }) {
  if (debts.length === 0) {
    return <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No debts with an APR yet. Add the details on the Accounts page.</p>;
  }
  const head: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)",
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 860 }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 16, padding: "0 4px 10px", borderBottom: "1px solid var(--glass-border)" }}>
          <span style={head}>Account</span>
          <span style={{ ...head, textAlign: "right" }}>Balance</span>
          <span style={head}>Utilization</span>
          <span style={{ ...head, textAlign: "right" }}>APR</span>
          <span style={{ ...head, textAlign: "right", whiteSpace: "nowrap" }}>Interest/mo</span>
          <span style={{ ...head, textAlign: "right" }}>Minimum</span>
          <span style={{ ...head, textAlign: "right" }}>Payoff</span>
        </div>
        {debts.map((d) => {
          const min = minPayment(d);
          const util = d.utilization_pct;
          return (
            <div
              key={d.account_id}
              style={{ display: "grid", gridTemplateColumns: COLS, gap: 16, alignItems: "center", padding: "14px 4px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span style={{ fontWeight: 500, color: "var(--text-strong)", fontSize: 14 }}>{d.name}</span>
              <Numeral style={{ textAlign: "right", fontWeight: 600, fontSize: 14 }}>{money(Number(d.current_balance), 2)}</Numeral>
              <span>
                {util != null && d.credit_limit != null ? (
                  <span style={{ display: "block" }}>
                    <span style={{ display: "block", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${Math.min(util, 100)}%`, background: utilColor(util), borderRadius: 3 }} />
                    </span>
                    <Numeral style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5, display: "block" }}>
                      {util.toFixed(0)}% of {money(Number(d.credit_limit))}
                    </Numeral>
                  </span>
                ) : (
                  <span style={{ color: "var(--text-faint)", fontSize: 12 }}>no limit set</span>
                )}
              </span>
              <Numeral style={{ textAlign: "right", fontSize: 14 }}>{d.apr != null ? `${Number(d.apr).toFixed(2)}%` : "n/a"}</Numeral>
              <Numeral style={{ textAlign: "right", fontSize: 14, color: "var(--attention)" }}>
                {d.monthly_interest != null ? money(Number(d.monthly_interest), 2) : "n/a"}
              </Numeral>
              <Numeral style={{ textAlign: "right", fontSize: 14 }}>{min != null ? money(min, 2) : "n/a"}</Numeral>
              <Numeral style={{ textAlign: "right", fontSize: 14, color: "var(--text-secondary)" }}>{monthsToText(d.payoff_month)}</Numeral>
            </div>
          );
        })}
      </div>
    </div>
  );
}
