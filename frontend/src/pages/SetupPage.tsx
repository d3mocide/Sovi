import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/ui/Logo";
import { theme } from "../theme";

export function SetupPage() {
  const { register, login, refreshAuth } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // 1. Register the admin user
      await register(email, password, displayName);
      // 2. Perform login immediately
      await login(email, password);
      // 3. Refresh auth state
      await refreshAuth();
      // 4. Navigate to TOTP setup
      navigate("/totp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ marginBottom: "40px" }}>
          <Logo size={40} wordmarkSize={28} />
          <p style={{ color: theme.colors.textMuted, fontSize: "14px", marginTop: "14px" }}>
            Set up your admin account to get started. Your data stays on your own hardware.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="admin@example.com"
            required
          />
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            placeholder="Administrator"
            required
          />
          <Input
            label="Password (min 12 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••••••"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••••••"
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
            Create Admin Account
          </Button>
        </form>
      </div>
    </div>
  );
}
