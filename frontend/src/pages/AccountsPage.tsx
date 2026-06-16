import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Numeral } from "../components/ui/Stat";
import { AppHeader, TabNav } from "../components/ui/AppChrome";
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
  const [minPaymentType, setMinPaymentType] = useState<"fixed" | "percent">("percent");
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
        min_payment_type: "fixed" | "percent";
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
      setMinPaymentType("percent");
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
    <div style={{ minHeight: "100vh", background: theme.colors.bg }}>
      <AppHeader />
      <TabNav />

      <main
        style={{
          padding: "24px",
          maxWidth: "680px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: theme.colors.text }}>
            Accounts
          </h2>
          {!loading && !error && (
            <p style={{ fontSize: "13px", color: theme.colors.textMuted, marginTop: "4px" }}>
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              {accounts.filter((a) => a.needs_classification).length > 0 && (
                <> &mdash; {accounts.filter((a) => a.needs_classification).length} need classification</>
              )}
            </p>
          )}
        </div>

        {loading && (
          <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>Loading…</p>
        )}

        {error && (
          <Card>
            <p style={{ color: theme.colors.warning, fontSize: "14px" }}>{error}</p>
          </Card>
        )}

        {accounts.map((account) => (
          <Card key={account.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "15px", color: theme.colors.text }}>
                    {account.name}
                  </span>
                  {account.needs_classification && (
                    <Badge variant="warning">Needs classification</Badge>
                  )}
                </div>

                {editingId === account.id ? (
                  <div
                    style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}
                  >
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      style={{
                        background: theme.colors.inputDeep,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.sm,
                        padding: "6px 10px",
                        color: theme.colors.text,
                        fontSize: "13px",
                      }}
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t] ?? t}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleSave(account.id)}
                      loading={saving}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}
                  >
                    <Badge variant="muted">{TYPE_LABELS[account.type] ?? account.type}</Badge>
                    {!account.has_debt_metadata &&
                      (account.type === "credit_card" || account.type === "loan") && (
                        <button
                          onClick={() => setDebtModalAccount(account)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            fontSize: "12px",
                            color: theme.colors.accent,
                            textDecoration: "underline",
                          }}
                        >
                          Set debt details
                        </button>
                      )}
                    {account.has_debt_metadata &&
                      (account.type === "credit_card" || account.type === "loan") && (
                        <button
                          onClick={() => setDebtModalAccount(account)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            fontSize: "12px",
                            color: theme.colors.textMuted,
                            textDecoration: "underline",
                          }}
                        >
                          Edit debt details
                        </button>
                      )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {account.latest_balance !== null && (
                  <Numeral
                    as="p"
                    style={{ fontWeight: 600, fontSize: "15px", color: theme.colors.text }}
                  >
                    {formatCurrency(account.latest_balance, account.currency)}
                  </Numeral>
                )}
                {editingId !== account.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    style={{ marginTop: "6px" }}
                    onClick={() => handleEdit(account)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </main>

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
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMinPaymentType(e.target.value as "fixed" | "percent")}
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
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Input
                    label={minPaymentType === "percent" ? "Min Payment (%)" : "Min Payment ($)"}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={minPaymentType === "percent" ? "2.0" : "25.00"}
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
    </div>
  );
}
