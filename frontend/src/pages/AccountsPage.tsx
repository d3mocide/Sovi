import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/ui/AppChrome";
import { Panel } from "../components/ui/Panel";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Numeral } from "../components/ui/Stat";
import { Icon } from "../components/ui/Icon";
import { AccountModal, TYPE_LABELS, type Account } from "../components/AccountModal";
import { money } from "../lib/format";

const isDebt = (a: Account) => a.type === "credit_card" || a.type === "loan";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ account: Account | null } | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAccounts(await api.get<Account[]>("/accounts"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const debts = accounts.filter(isDebt);
  const other = accounts.filter((a) => !isDebt(a));
  const needs = accounts.filter((a) => a.needs_classification).length;

  const groups = [
    { title: "Debts", rows: debts, debt: true, aside: `${debts.length} · owed ${money(debts.reduce((t, a) => t + Math.max(-(a.latest_balance ?? 0), 0), 0))}` },
    { title: "Assets and other", rows: other, debt: false, aside: `${other.length} · ${money(other.reduce((t, a) => t + (a.latest_balance ?? 0), 0))}` },
  ].filter((g) => g.rows.length > 0);

  return (
    <>
      <AppShell
        title="Accounts"
        subtitle={!loading && !error ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""}${needs > 0 ? `, ${needs} need classification` : ""}` : undefined}
        actions={
          <Button size="sm" onClick={() => setModal({ account: null })} iconLeft={<Icon name="plus" size={15} />}>
            Add account
          </Button>
        }
      >
        {loading && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</p>}
        {error && <Panel><p style={{ color: "var(--attention)", fontSize: 14 }}>{error}</p></Panel>}

        {!loading && !error && accounts.length === 0 && (
          <Panel title="Nothing here yet">
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
              Add your credit cards and loans by hand, or connect Sure or SimpleFIN in Settings and they will appear on their own.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setModal({ account: null })}>Add your first account</Button>
            </div>
          </Panel>
        )}

        {!loading && !error && accounts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {groups.map((g) => (
              <Panel key={g.title} title={g.title} aside={g.aside}>
                {g.rows.map((a, i) => {
                  const bal = a.latest_balance;
                  const shown = bal === null ? null : g.debt ? Math.max(-bal, 0) : bal;
                  const util = g.debt && a.credit_limit && shown !== null ? (shown / a.credit_limit) * 100 : null;
                  const missing = g.debt && !a.has_debt_metadata;
                  return (
                    <div key={a.id} className="acct-row" style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="c-name">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-strong)" }}>{a.name}</span>
                          {a.needs_classification && <Badge variant="warning">Needs classification</Badge>}
                          {missing && <Badge variant="warning">No APR yet</Badge>}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                          <Badge variant="muted">{TYPE_LABELS[a.type] ?? a.type}</Badge>
                          <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{a.is_manual ? "entered by hand" : "synced"}</span>
                        </div>
                      </div>
                      <div className="c-bal">
                        <Numeral style={{ fontWeight: 600, fontSize: 15 }}>{shown !== null ? money(shown, 2) : "no balance yet"}</Numeral>
                        {g.debt && shown !== null && <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>owed</span>}
                      </div>
                      <div className="c-util">
                        {util !== null && a.credit_limit ? (
                          <>
                            <span style={{ display: "block", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                              <span style={{ display: "block", height: "100%", width: `${Math.min(util, 100)}%`, background: util >= 70 ? "var(--attention)" : util >= 30 ? "var(--data-1)" : "var(--positive)", borderRadius: 3 }} />
                            </span>
                            <Numeral style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5, display: "block" }}>
                              {util.toFixed(0)}% of {money(a.credit_limit)}
                            </Numeral>
                          </>
                        ) : g.debt && a.type === "credit_card" ? (
                          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>no credit limit set</span>
                        ) : null}
                      </div>
                      <div className="c-act">
                        <Button size="sm" variant={missing ? "secondary" : "ghost"} onClick={() => setModal({ account: a })}>
                          {missing ? "Add APR" : "Edit"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Panel>
            ))}
          </div>
        )}
      </AppShell>

      {modal && <AccountModal account={modal.account} onClose={() => setModal(null)} onSaved={load} />}
    </>
  );
}
