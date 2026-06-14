import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { theme } from "../theme";

export function LoginPage() {
  const { login } = useAuth();
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
      navigate("/totp");
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
        background: theme.colors.bg,
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: theme.colors.text,
              letterSpacing: "-0.02em",
            }}
          >
            Sovi
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: "14px", marginTop: "6px" }}>
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
                background: "rgba(251,191,36,0.1)",
                borderRadius: theme.radius.sm,
                border: `1px solid rgba(251,191,36,0.2)`,
              }}
            >
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} size="lg" style={{ marginTop: "8px" }}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
