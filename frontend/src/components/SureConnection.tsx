import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";

interface SureStatus {
  connected: boolean;
  base_url: string | null;
  status: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  details_synced_at: string | null;
  details_note: string | null;
  account_count: number | null;
}

function ago(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

/** Connect Sure (read-only API key, stored encrypted) and trigger syncs. */
export function SureConnection() {
  const [status, setStatus] = useState<SureStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await api.get<SureStatus>("/sure/status"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // While a first sync is running, poll so the status line updates by itself.
  useEffect(() => {
    if (!status?.connected || status.last_sync_at) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [status, load]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/sure/connect", { base_url: baseUrl, api_key: apiKey });
      setApiKey("");
      setMsg("Connected. The first sync is running; it can take a minute.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/sure/refresh");
      setMsg("Sync queued.");
      setTimeout(load, 5000);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  interface ImportResult {
    updated: string[];
    created: string[];
    needs_min_payment: string[];
    no_details: string[];
    accounts_in_export: number;
  }

  const importDetails = async (file: File) => {
    setBusy(true);
    setMsg(null);
    try {
      const csrf = document.cookie.split("; ").find((r) => r.startsWith("sovi_csrf="))?.split("=")[1];
      const res = await fetch("/api/sure/details/import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/octet-stream", ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
        body: file,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Import failed");
      }
      const r: ImportResult = await res.json();
      const done = r.updated.length + r.created.length;
      const parts = [`Read APR, minimum payment and limits for ${done} account${done === 1 ? "" : "s"}.`];
      if (r.needs_min_payment.length) parts.push(`No minimum payment in Sure for: ${r.needs_min_payment.join(", ")}.`);
      if (r.no_details.length) parts.push(`Nothing in the export for: ${r.no_details.join(", ")}.`);
      setMsg(parts.join(" "));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Forget the Sure key? Accounts and transactions already synced stay in Sovi.")) return;
    setBusy(true);
    try {
      await api.delete("/sure/disconnect");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const muted: React.CSSProperties = { fontSize: 13, color: "var(--text-muted)" };

  return (
    <Panel
      title="Sure connection"
      aside={status?.connected ? <Badge variant={status.status === "active" ? "positive" : "warning"}>{status.status}</Badge> : undefined}
    >
      {status?.connected ? (
        <>
          <p style={muted}>
            Reading from <span style={{ color: "var(--text-secondary)" }}>{status.base_url}</span>
          </p>
          <p style={{ ...muted, marginTop: 6 }}>
            {status.account_count ?? 0} accounts · last sync {ago(status.last_sync_at)}
          </p>
          {status.details_synced_at && (
            <p style={{ ...muted, marginTop: 6 }}>APR, minimum payments and limits: read from Sure {ago(status.details_synced_at)}</p>
          )}
          {status.details_note && <p style={{ ...muted, color: "var(--attention)", marginTop: 6 }}>{status.details_note}</p>}
          {status.last_error && <p style={{ ...muted, color: "var(--attention)", marginTop: 6 }}>{status.last_error}</p>}
          <p style={{ ...muted, marginTop: 12 }}>
            Sure's API leaves out APR, minimum payments and limits. In Sure, open Exports, export your data, and upload the zip
            here (or its all.ndjson). Sovi reads only the account details from it, and Sure's values replace what is in Sovi for those fields.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={busy}>
              Import account details
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,.ndjson"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) importDetails(f);
              }}
            />
            <Button size="sm" variant="secondary" onClick={syncNow} loading={busy}>
              Sync now
            </Button>
            <Button size="sm" variant="ghost" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={connect} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={muted}>
            Pull accounts, balances and transactions from your Sure server. Use a read-only API key (Sure: Settings, API keys). Sure's API does not
            include APR, minimum payments or limits, so enter those on the Accounts page. The key is stored encrypted and is only ever sent to Sure.
          </p>
          <Input label="Sure URL" placeholder="https://sure.example.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required />
          <Input label="API key" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
          <div>
            <Button type="submit" size="sm" loading={busy}>
              Connect
            </Button>
          </div>
        </form>
      )}
      {msg && <p style={{ ...muted, marginTop: 12 }}>{msg}</p>}
    </Panel>
  );
}
