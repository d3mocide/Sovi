import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/ui/Logo";
import { Icon } from "../components/ui/Icon";
import { theme } from "../theme";

export function LoginPage() {
  const { login, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.totp_required) {
        navigate("/totp");
      } else {
        await refreshAuth();
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, var(--sky-glow), transparent 70%), var(--bg-app)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ marginBottom: "40px" }}>
          <Logo size={40} wordmarkSize={28} />
          <p style={{ color: theme.colors.textMuted, fontSize: "14px", marginTop: "14px" }}>
            Your numbers. Your stack. Your control.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
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
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} size="lg" style={{ marginTop: "8px" }}>
            Sign in
          </Button>
        </form>

        {/* Privacy through-line — calm reassurance, never a sales pitch. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "28px",
            color: theme.colors.textFaint,
            fontSize: "12px",
          }}
        >
          <Icon name="lock" size={14} />
          Nothing leaves your network.
        </div>
      </div>
    </div>
  );
}
