import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
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
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.colors.border}`,
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
      </header>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
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
              color: item.to === "/accounts" ? theme.colors.accent : theme.colors.textMuted,
              borderBottom:
                item.to === "/accounts"
                  ? `2px solid ${theme.colors.accent}`
                  : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main
        style={{
          padding: "24px 20px",
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
                        background: "#0a1628",
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
                        <span style={{ fontSize: "12px", color: theme.colors.accent }}>
                          Set debt details
                        </span>
                      )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {account.latest_balance !== null && (
                  <p style={{ fontWeight: 600, fontSize: "15px", color: theme.colors.text }}>
                    {formatCurrency(account.latest_balance, account.currency)}
                  </p>
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
    </div>
  );
}
