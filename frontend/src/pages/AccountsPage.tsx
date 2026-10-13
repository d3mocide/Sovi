import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Numeral } from "../components/ui/Stat";
import { AppShell } from "../components/ui/AppChrome";
import { Panel } from "../components/ui/Panel";
import { theme } from "../theme";

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  is_manual: boolean;
  credit_limit: number | null;
  latest_balance: number | null;
  needs_classification: boolean;
  has_debt_metadata: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  loan: "Loan",
  investment: "Investment",
  other: "Other",
};

const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "credit_card",
  "loan",
  "investment",
  "other",
];

function formatCurrency(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Debt metadata modal state
  const [debtModalAccount, setDebtModalAccount] = useState<Account | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [apr, setApr] = useState("");
  const [minPaymentType, setMinPaymentType] = useState<"fixed" | "percent" | "interest_plus_percent">("interest_plus_percent");
  const [minPaymentValue, setMinPaymentValue] = useState("");
  const [minPaymentFloor, setMinPaymentFloor] = useState("");
  const [statementDueDay, setStatementDueDay] = useState("");
  const [originalPrincipal, setOriginalPrincipal] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadataSaving, setMetadataSaving] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<Account[]>("/accounts");
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDebtMetadata = useCallback(async (accountId: string) => {
    setMetadataLoading(true);
    setMetadataError(null);
    try {
      const data = await api.get<{
        apr: number;
        min_payment_type: "fixed" | "percent" | "interest_plus_percent";
        min_payment_value: number;
        min_payment_floor: number | null;
        statement_due_day: number | null;
        original_principal: number | null;
        term_months: number | null;
        opened_date: string | null;
      }>(`/accounts/${accountId}/debt-metadata`);
      setApr(data.apr.toString());
      setMinPaymentType(data.min_payment_type);
      setMinPaymentValue(data.min_payment_value.toString());
      setMinPaymentFloor(data.min_payment_floor !== null ? data.min_payment_floor.toString() : "");
      setStatementDueDay(data.statement_due_day !== null ? data.statement_due_day.toString() : "");
      setOriginalPrincipal(data.original_principal !== null ? data.original_principal.toString() : "");
      setTermMonths(data.term_months !== null ? data.term_months.toString() : "");
      setOpenedDate(data.opened_date || "");
    } catch (err) {
      setApr("");
      setMinPaymentType("interest_plus_percent");
      setMinPaymentValue("");
      setMinPaymentFloor("");
      setStatementDueDay("");
      setOriginalPrincipal("");
      setTermMonths("");
      setOpenedDate("");
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debtModalAccount) {
      loadDebtMetadata(debtModalAccount.id);
    }
  }, [debtModalAccount, loadDebtMetadata]);

  const handleSaveDebtMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtModalAccount) return;
    setMetadataSaving(true);
    setMetadataError(null);
    try {
      const payload = {
        apr: parseFloat(apr),
        min_payment_type: minPaymentType,
        min_payment_value: parseFloat(minPaymentValue),
        min_payment_floor: minPaymentFloor ? parseFloat(minPaymentFloor) : null,
        statement_due_day: statementDueDay ? parseInt(statementDueDay, 10) : null,
        original_principal: originalPrincipal ? parseFloat(originalPrincipal) : null,
        term_months: termMonths ? parseInt(termMonths, 10) : null,
        opened_date: openedDate || null,
      };

      await api.put(`/accounts/${debtModalAccount.id}/debt-metadata`, payload);
      setDebtModalAccount(null);
      await loadAccounts();
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : "Failed to save debt details");
    } finally {
      setMetadataSaving(false);
    }
  };

  const handleDeleteDebtMetadata = async () => {
    if (!debtModalAccount) return;
    if (!window.confirm("Are you sure you want to remove the debt configuration for this account?")) return;
    setMetadataSaving(true);
    setMetadataError(null);
    try {
      await api.delete(`/accounts/${debtModalAccount.id}/debt-metadata`);
      setDebtModalAccount(null);
      await loadAccounts();
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : "Failed to delete debt details");
    } finally {
      setMetadataSaving(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setEditType(account.type);
  };

  const handleSave = async (accountId: string) => {
    setSaving(true);
    try {
      await api.put(`/accounts/${accountId}`, { type: editType });
      setEditingId(null);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppShell
        title="Accounts"
        subtitle={
          !loading && !error
            ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""}${
                accounts.filter((a) => a.needs_classification).length > 0
                  ? `, ${accounts.filter((a) => a.needs_classification).length} need classification`
                  : ""
              }`
            : undefined
        }
      >
        {loading && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</p>}
        {error && (
          <Panel>
            <p style={{ color: "var(--attention)", fontSize: 14 }}>{error}</p>
          </Panel>
        )}
        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { title: "Debts", rows: accounts.filter((a) => a.type === "credit_card" || a.type === "loan"), debt: true },
              { title: "Assets and other", rows: accounts.filter((a) => a.type !== "credit_card" && a.type !== "loan"), debt: false },
            ]
              .filter((g) => g.rows.length > 0)
              .map((g) => (
                <Panel key={g.title} title={g.title} aside={g.debt ? `${g.rows.length} · owed ${formatCurrency(g.rows.reduce((t, a) => t + Math.max(-(a.latest_balance ?? 0), 0), 0))}` : `${g.rows.length}`}>
                  <div style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: 720 }}>
                      {g.rows.map((account, i) => {
                        const isDebt = g.debt;
                        const bal = account.latest_balance;
                        const shown = bal === null ? null : isDebt ? Math.max(-bal, 0) : bal;
                        const util = isDebt && account.credit_limit && shown !== null ? (shown / account.credit_limit) * 100 : null;
                        const editing = editingId === account.id;
                        return (
                          <div
                            key={account.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(200px, 2fr) 1.3fr 1.6fr auto",
                              gap: 16,
                              alignItems: "center",
                              padding: "13px 2px",
                              borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-strong)" }}>{account.name}</span>
                                {account.needs_classification && <Badge variant="warning">Needs classification</Badge>}
                              </div>
                              {editing ? (
                                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                  <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value)}
                                    style={{ background: theme.colors.inputDeep, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: "6px 10px", color: theme.colors.text, fontSize: 13 }}
                                  >
                                    {ACCOUNT_TYPES.map((t) => (
                                      <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
                                    ))}
                                  </select>
                                  <Button size="sm" onClick={() => handleSave(account.id)} loading={saving}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                                  <Badge variant="muted">{TYPE_LABELS[account.type] ?? account.type}</Badge>
                                  {account.is_manual && <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>manual</span>}
                                </div>
                              )}
                            </div>

                            <Numeral style={{ textAlign: "right", fontWeight: 600, fontSize: 15, color: isDebt && shown ? "var(--text-strong)" : "var(--text-strong)" }}>
                              {shown !== null ? formatCurrency(shown, account.currency) : "no balance yet"}
                              {isDebt && <span style={{ display: "block", fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>owed</span>}
                            </Numeral>

                            <div>
                              {isDebt ? (
                                util !== null && account.credit_limit ? (
                                  <>
                                    <span style={{ display: "block", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                                      <span style={{ display: "block", height: "100%", width: `${Math.min(util, 100)}%`, background: util >= 70 ? "var(--attention)" : util >= 30 ? "var(--data-1)" : "var(--positive)", borderRadius: 3 }} />
                                    </span>
                                    <Numeral style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5, display: "block" }}>
                                      {util.toFixed(0)}% of {formatCurrency(account.credit_limit)}
                                    </Numeral>
                                  </>
                                ) : (
                                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{account.type === "credit_card" ? "no credit limit set" : ""}</span>
                                )
                              ) : null}
                            </div>

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                              {isDebt && (
                                <Button size="sm" variant={account.has_debt_metadata ? "ghost" : "secondary"} onClick={() => setDebtModalAccount(account)}>
                                  {account.has_debt_metadata ? "Debt details" : "Set APR and minimum"}
                                </Button>
                              )}
                              {!editing && (
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(account)}>Type</Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Panel>
              ))}
          </div>
        )}
      </AppShell>

      {debtModalAccount && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.colors.overlay,
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              boxShadow: theme.shadow.modal,
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Debt Details: {debtModalAccount.name}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: theme.colors.textMuted,
                marginBottom: "20px",
              }}
            >
              Configure the APR and payment terms for the payoff engine.
            </p>

            {metadataLoading ? (
              <p style={{ color: theme.colors.textMuted, fontSize: "14px", textAlign: "center", padding: "20px" }}>
                Loading metadata…
              </p>
            ) : (
              <form onSubmit={handleSaveDebtMetadata} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Input
                    label="APR (%)"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="24.99"
                    value={apr}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApr(e.target.value)}
                    required
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: theme.colors.textMuted }}>
                      Payment Type
                    </label>
                    <select
                      value={minPaymentType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMinPaymentType(e.target.value as "fixed" | "percent" | "interest_plus_percent")}
                      style={{
                        background: theme.colors.inputDeep,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.sm,
                        padding: "8px 12px",
                        color: theme.colors.text,
                        fontSize: "14px",
                        height: "40px",
                      }}
                    >
                      <option value="interest_plus_percent">Interest + % of balance</option>
                      <option value="percent">Percentage of balance (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Input
                    label={minPaymentType === "fixed" ? "Min Payment ($)" : minPaymentType === "interest_plus_percent" ? "Plus this % of balance" : "Min Payment (%)"}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={minPaymentType === "fixed" ? "25.00" : minPaymentType === "interest_plus_percent" ? "1.0" : "2.0"}
                    value={minPaymentValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinPaymentValue(e.target.value)}
                    required
                  />

                  <Input
                    label="Payment Floor ($)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15.00"
                    value={minPaymentFloor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinPaymentFloor(e.target.value)}
                    disabled={minPaymentType === "fixed"}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Input
                    label="Due Day (1-31)"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={statementDueDay}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStatementDueDay(e.target.value)}
                  />

                  <Input
                    label="Original Principal ($)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000.00"
                    value={originalPrincipal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOriginalPrincipal(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Input
                    label="Term (Months)"
                    type="number"
                    min="1"
                    placeholder="60"
                    value={termMonths}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermMonths(e.target.value)}
                  />

                  <Input
                    label="Opened Date"
                    type="date"
                    value={openedDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOpenedDate(e.target.value)}
                  />
                </div>

                {metadataError && (
                  <p
                    style={{
                      color: theme.colors.warning,
                      fontSize: "13px",
                      padding: "10px 14px",
                      background: theme.colors.warningTint,
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${theme.colors.warningTintBorder}`,
                    }}
                  >
                    {metadataError}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                  {debtModalAccount.has_debt_metadata ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDeleteDebtMetadata}
                      disabled={metadataSaving}
                    >
                      Delete
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setDebtModalAccount(null)}
                      disabled={metadataSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" loading={metadataSaving}>
                      Save
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
