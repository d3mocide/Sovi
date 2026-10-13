import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export interface Account {
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

export const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit card",
  loan: "Loan",
  investment: "Investment",
  other: "Other",
};
const TYPES = ["credit_card", "loan", "checking", "savings", "investment", "other"];
const isDebt = (t: string) => t === "credit_card" || t === "loan";

type MinType = "fixed" | "percent" | "interest_plus_percent";

const selectStyle: React.CSSProperties = {
  background: "var(--surface-input)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)",
  padding: "9px 10px", color: "var(--text-strong)", fontSize: 14, width: "100%",
};
const label: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: 6 };
const sectionTitle: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", margin: "20px 0 10px" };

/** Add a manual account, or edit any account (name, type, limit, balance for manual ones, debt details). */
export function AccountModal({ account, onClose, onSaved }: { account: Account | null; onClose: () => void; onSaved: () => void }) {
  const editing = account !== null;
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "credit_card");
  const [balance, setBalance] = useState(() => {
    if (!account || account.latest_balance === null) return "";
    return String(isDebt(account.type) ? Math.max(-account.latest_balance, 0) : account.latest_balance);
  });
  const [limit, setLimit] = useState(account?.credit_limit != null ? String(account.credit_limit) : "");
  const [apr, setApr] = useState("");
  const [minType, setMinType] = useState<MinType>("interest_plus_percent");
  const [minValue, setMinValue] = useState("1");
  const [minFloor, setMinFloor] = useState("25");
  const [dueDay, setDueDay] = useState("");
  const [hadDebtDetails, setHadDebtDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!account || !isDebt(account.type) || !account.has_debt_metadata) return;
    api
      .get<{ apr: number; min_payment_type: MinType; min_payment_value: number; min_payment_floor: number | null; statement_due_day: number | null }>(
        `/accounts/${account.id}/debt-metadata`
      )
      .then((d) => {
        setApr(String(d.apr));
        setMinType(d.min_payment_type);
        setMinValue(String(d.min_payment_value));
        setMinFloor(d.min_payment_floor != null ? String(d.min_payment_floor) : "");
        setDueDay(d.statement_due_day != null ? String(d.statement_due_day) : "");
        setHadDebtDetails(true);
      })
      .catch(() => undefined);
  }, [account]);

  const debt = isDebt(type);
  const manualBalanceEditable = !editing || account!.is_manual;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      let id = account?.id;
      const lim = limit !== "" ? parseFloat(limit) : null;
      if (!editing) {
        const created = await api.post<{ id: string }>("/accounts/manual", {
          name: name.trim(), type, credit_limit: type === "credit_card" ? lim : null,
          initial_balance: balance !== "" ? parseFloat(balance) : null,
        });
        id = created.id;
      } else {
        await api.put(`/accounts/${id}`, { name: name.trim(), type, ...(type === "credit_card" && lim !== null ? { credit_limit: lim } : {}) });
        if (manualBalanceEditable && balance !== "") {
          const cur = account!.latest_balance;
          const curShown = cur === null ? null : isDebt(account!.type) ? Math.max(-cur, 0) : cur;
          if (curShown === null || Math.abs(curShown - parseFloat(balance)) > 0.004) await api.post(`/accounts/${id}/balance`, { balance: parseFloat(balance) });
        }
      }
      if (debt && apr !== "") {
        await api.put(`/accounts/${id}/debt-metadata`, {
          apr: parseFloat(apr), min_payment_type: minType, min_payment_value: parseFloat(minValue || "0"),
          min_payment_floor: minFloor !== "" ? parseFloat(minFloor) : null,
          statement_due_day: dueDay !== "" ? parseInt(dueDay, 10) : null,
          original_principal: null, term_months: null, opened_date: null,
        });
      }
      onSaved();
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const removeDebtDetails = async () => {
    if (!account || !confirm("Remove the APR and minimum for this account?")) return;
    setBusy(true);
    try {
      await api.delete(`/accounts/${account.id}/debt-metadata`);
      onSaved();
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!account || !confirm(`Remove "${account.name}" from Sovi? Its history is kept but it is hidden.`)) return;
    setBusy(true);
    try {
      await api.put(`/accounts/${account.id}`, { archived: true });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "5vh 16px", overflowY: "auto" }}
    >
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="glass" style={{ width: "100%", maxWidth: 520, padding: 24, background: "var(--glass-bg-strong)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-strong)", letterSpacing: "-0.01em" }}>{editing ? "Edit account" : "Add an account"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          {editing ? (account!.is_manual ? "Entered by hand." : "Synced from your connection. Balances update automatically.") : "Enter it by hand. You can connect Sure or SimpleFIN later."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rewards Visa" required />
          </div>
          <div>
            <label style={label}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          {manualBalanceEditable ? (
            <Input label={debt ? "Amount you owe ($)" : "Balance ($)"} type="number" step="0.01" min={debt ? 0 : undefined} value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" />
          ) : (
            <div><label style={label}>Balance</label><p style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>from your connection</p></div>
          )}
          {type === "credit_card" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Credit limit ($)" type="number" step="1" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="9000" />
            </div>
          )}
        </div>

        {debt && (
          <>
            <p style={sectionTitle}>Debt details</p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
              The payoff plan needs these. Your statement lists the APR and the minimum payment.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="APR (%)" type="number" step="0.01" min={0} value={apr} onChange={(e) => setApr(e.target.value)} placeholder="23.99" />
              <Input label="Statement due day" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="12" />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>How is the minimum worked out?</label>
                <select value={minType} onChange={(e) => setMinType(e.target.value as MinType)} style={selectStyle}>
                  <option value="interest_plus_percent">Interest plus a % of the balance (most cards)</option>
                  <option value="percent">A % of the balance</option>
                  <option value="fixed">A fixed amount (most loans)</option>
                </select>
              </div>
              <Input
                label={minType === "fixed" ? "Monthly payment ($)" : "Plus this % of balance"}
                type="number" step="0.01" min={0} value={minValue} onChange={(e) => setMinValue(e.target.value)}
              />
              {minType !== "fixed" && <Input label="Never less than ($)" type="number" step="1" min={0} value={minFloor} onChange={(e) => setMinFloor(e.target.value)} />}
            </div>
          </>
        )}

        {err && <p style={{ fontSize: 13, color: "var(--attention)", marginTop: 14 }}>{err}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          <Button type="submit" loading={busy}>{editing ? "Save" : "Add account"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <span style={{ flex: 1 }} />
          {editing && debt && hadDebtDetails && <Button type="button" variant="ghost" size="sm" onClick={removeDebtDetails}>Remove APR</Button>}
          {editing && <Button type="button" variant="ghost" size="sm" onClick={archive} style={{ color: "var(--attention)" }}>Remove account</Button>}
        </div>
      </form>
    </div>
  );
}
