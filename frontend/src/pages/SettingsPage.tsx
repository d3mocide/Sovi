import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Eyebrow, Numeral } from "../components/ui/Stat";
import { AppHeader } from "../components/ui/AppChrome";
import { Icon } from "../components/ui/Icon";
import { theme } from "../theme";

interface SfinStatus {
  connected: boolean;
  status: string | null;
  last_sync_at: string | null;
}

export function SettingsPage() {
  const { user, logout, disableTotp } = useAuth();
  const navigate = useNavigate();

  const [sfinStatus, setSfinStatus] = useState<SfinStatus | null>(null);
  const [setupUrl, setSetupUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [disablingTotp, setDisablingTotp] = useState(false);

  const handleDisableTotp = async () => {
    setDisablingTotp(true);
    try {
      await disableTotp();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disable TOTP");
    } finally {
      setDisablingTotp(false);
    }
  };

  const loadStatus = useCallback(async () => {
    try {
      const s = await api.get<SfinStatus>("/simplefin/status");
      setSfinStatus(s);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setConnectMsg(null);
    try {
      await api.post("/simplefin/connect", { setup_url: setupUrl });
      setSetupUrl("");
      setConnectMsg("Connected successfully.");
      await loadStatus();
    } catch (err) {
      setConnectMsg(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect SimpleFIN? Your account data will remain but no longer sync.")) return;
    setDisconnecting(true);
    try {
      await api.delete("/simplefin/disconnect");
      await loadStatus();
    } catch (err) {
      setConnectMsg(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bg }}>
      <AppHeader>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: theme.colors.textMuted,
          }}
        >
          <Icon name="arrowLeft" size={15} />
          Dashboard
        </Link>
      </AppHeader>

      <main
        style={{
          padding: "24px",
          maxWidth: "580px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Account */}
        <Card>
          <Eyebrow style={{ marginBottom: "14px" }}>Account</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>Email</span>
              <span style={{ fontSize: "13px", color: theme.colors.text }}>{user?.email}</span>
            </div>
            {user?.display_name && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>Name</span>
                <span style={{ fontSize: "13px", color: theme.colors.text }}>
                  {user.display_name}
                </span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                Two-factor auth
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Badge variant={user?.totp_enabled ? "positive" : "warning"}>
                  {user?.totp_enabled ? "Enabled" : "Not set up"}
                </Badge>
                {user?.totp_enabled ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisableTotp}
                    loading={disablingTotp}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/totp")}
                  >
                    Set up
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* SimpleFIN */}
        <Card>
          <Eyebrow style={{ marginBottom: "14px" }}>SimpleFIN connection</Eyebrow>

          {sfinStatus === null ? (
            <p style={{ color: theme.colors.textMuted, fontSize: "13px" }}>Loading…</p>
          ) : sfinStatus.connected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Badge variant="positive">Connected</Badge>
                {sfinStatus.status && (
                  <span style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                    {sfinStatus.status}
                  </span>
                )}
              </div>
              {sfinStatus.last_sync_at && (
                <p style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                  Last sync:{" "}
                  <Numeral>
                    {new Date(sfinStatus.last_sync_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Numeral>
                </p>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnect}
                loading={disconnecting}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleConnect}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <Input
                label="SimpleFIN setup URL"
                type="url"
                value={setupUrl}
                onChange={(e) => setSetupUrl(e.target.value)}
                placeholder="https://bridge.simplefin.org/simplefin/claim/..."
                required
              />
              <Button type="submit" loading={connecting} size="sm">
                Connect
              </Button>
            </form>
          )}

          {connectMsg && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: theme.colors.textMuted,
              }}
            >
              {connectMsg}
            </p>
          )}
        </Card>

        {/* Logout */}
        <Card>
          <Button
            variant="ghost"
            onClick={handleLogout}
            loading={loggingOut}
            style={{ color: theme.colors.warning }}
          >
            Sign out
          </Button>
        </Card>
      </main>
    </div>
  );
}
