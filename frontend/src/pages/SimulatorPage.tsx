import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { simulate, simulateSideBySide } from "@sovi/payoff";
import type { Debt, Strategy } from "@sovi/payoff";
import { useGamification } from "../hooks/useGamification";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { theme } from "../theme";

type ViewStrategy = "avalanche" | "snowball" | "side-by-side";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | null): string {
  if (!d) return "Beyond 50 years";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
        minPaymentType: "percent" as const,
        minPaymentValue: 1,
        minPaymentFloor: 25,
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bg, padding: "24px" }}>
        <p style={{ color: theme.colors.textMuted }}>Loading…</p>
      </div>
    );
  }

  const isSideBySide = strategy === "side-by-side";
  const sideBySideResult = isSideBySide ? (result as ReturnType<typeof simulateSideBySide>) : null;
  const singleResult = !isSideBySide ? (result as ReturnType<typeof simulate>) : null;

  const monthsSaved =
    singleResult && baseline
      ? Math.max(0, baseline.totalMonths - singleResult.totalMonths)
      : 0;

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
              color: item.to === "/simulator" ? theme.colors.accent : theme.colors.textMuted,
              borderBottom:
                item.to === "/simulator"
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
          gap: "20px",
        }}
      >
        {debts.length === 0 && (
          <Card>
            <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
              No debts with APR configured. Add debt details in Accounts first.
            </p>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: theme.colors.textMuted,
              marginBottom: "16px",
            }}
          >
            Extra monthly payment
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={extra}
              onChange={(e) => handleSlider(Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.colors.accent }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: theme.colors.textMuted, fontSize: "14px" }}>$</span>
              <input
                type="number"
                min={0}
                value={extraInput}
                onChange={(e) => handleInputChange(e.target.value)}
                style={{
                  width: "80px",
                  background: "#0a1628",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: "6px 10px",
                  color: theme.colors.text,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* Strategy toggle */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["avalanche", "snowball", "side-by-side"] as ViewStrategy[]).map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                style={{
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${strategy === s ? theme.colors.accent : theme.colors.border}`,
                  background: strategy === s ? "rgba(56,189,248,0.12)" : "transparent",
                  color: strategy === s ? theme.colors.accent : theme.colors.textMuted,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {s === "side-by-side" ? "Side-by-side" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Results */}
        {singleResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Card style={{ padding: "16px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: theme.colors.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  Debt-free date
                </p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: theme.colors.accent }}>
                  {formatDate(singleResult.debtFreeDate)}
                </p>
              </Card>

              <Card style={{ padding: "16px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: theme.colors.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  Total interest
                </p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: theme.colors.text }}>
                  {formatCurrency(singleResult.totalInterest)}
                </p>
              </Card>
            </div>

            {monthsSaved > 0 && (
              <Card style={{ padding: "16px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: theme.colors.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  Saved vs minimums only
                </p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: theme.colors.positive }}>
                  {monthsSaved} months earlier &nbsp;·&nbsp;{" "}
                  {formatCurrency(
                    Math.max(0, (baseline?.totalInterest ?? 0) - singleResult.totalInterest)
                  )}{" "}
                  less interest
                </p>
              </Card>
            )}

            {singleResult.warnings.length > 0 && (
              <Card style={{ padding: "16px", borderColor: theme.colors.warning }}>
                {singleResult.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: "13px", color: theme.colors.warning }}>
                    {w}
                  </p>
                ))}
              </Card>
            )}

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Button onClick={handleSave} loading={saving} variant="secondary">
                Save scenario
              </Button>
              {saveMsg && (
                <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>{saveMsg}</span>
              )}
            </div>
          </div>
        )}

        {/* Side-by-side results */}
        {sideBySideResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {(
                [
                  { key: "avalanche", label: "Avalanche", r: sideBySideResult.avalanche },
                  { key: "snowball", label: "Snowball", r: sideBySideResult.snowball },
                ] as const
              ).map(({ key, label, r }) => (
                <Card key={key} style={{ padding: "16px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: theme.colors.textMuted,
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {label}
                  </p>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: theme.colors.accent }}>
                    {formatDate(r.debtFreeDate)}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: theme.colors.textMuted,
                      marginTop: "6px",
                    }}
                  >
                    {formatCurrency(r.totalInterest)} interest
                  </p>
                </Card>
              ))}
            </div>

            {(sideBySideResult.monthsDelta !== 0 || sideBySideResult.interestDelta !== 0) && (
              <Card style={{ padding: "16px" }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: theme.colors.textMuted,
                  }}
                >
                  Avalanche is{" "}
                  <span style={{ color: theme.colors.positive, fontWeight: 600 }}>
                    {Math.abs(sideBySideResult.monthsDelta)} months faster
                  </span>{" "}
                  and saves{" "}
                  <span style={{ color: theme.colors.positive, fontWeight: 600 }}>
                    {formatCurrency(Math.abs(sideBySideResult.interestDelta))}
                  </span>{" "}
                  in interest vs snowball.
                </p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
