import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { theme } from "../theme";

export function TotpPage() {
  const { enrollTotp, verifyTotp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrollData, setEnrollData] = useState<{ secret: string; uri: string } | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleEnroll = async () => {
    setEnrollLoading(true);
    setError(null);
    try {
      const data = await enrollTotp();
      setEnrollData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleCodeChange = async (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    setCode(clean);
    if (clean.length === 6) {
      await handleVerify(clean);
    }
  };

  const handleVerify = async (c = code) => {
    if (c.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      await verifyTotp(c);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setCode("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUri = () => {
    if (enrollData?.uri) {
      navigator.clipboard.writeText(enrollData.uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: theme.colors.text,
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          Sovi
        </h1>
        <p style={{ color: theme.colors.textMuted, fontSize: "14px", marginBottom: "32px" }}>
          Two-factor authentication
        </p>

        {enrollData ? (
          <Card style={{ marginBottom: "24px" }}>
            <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px" }}>
              Scan with your authenticator app
            </p>
            <p style={{ fontSize: "12px", color: theme.colors.textMuted, marginBottom: "12px" }}>
              Or copy the URI and import it manually:
            </p>
            <div
              style={{
                background: "#0a1628",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                padding: "10px 12px",
                fontSize: "11px",
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.mono,
                wordBreak: "break-all",
                marginBottom: "12px",
              }}
            >
              {enrollData.uri}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyUri}
            >
              {copied ? "Copied!" : "Copy URI"}
            </Button>
          </Card>
        ) : (
          <Card style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "14px", color: theme.colors.textMuted, marginBottom: "12px" }}>
              Need to set up your authenticator app?
            </p>
            <Button
              variant="secondary"
              onClick={handleEnroll}
              loading={enrollLoading}
            >
              Set up authenticator
            </Button>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            ref={inputRef}
            label="6-digit code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="000000"
            maxLength={6}
            style={{ textAlign: "center", fontSize: "24px", letterSpacing: "0.2em" }}
          />

          {error && (
            <p
              style={{
                color: theme.colors.warning,
                fontSize: "13px",
                padding: "10px 14px",
                background: "rgba(251,191,36,0.1)",
                borderRadius: theme.radius.sm,
              }}
            >
              {error}
            </p>
          )}

          <Button
            onClick={() => handleVerify()}
            loading={loading}
            disabled={code.length !== 6}
            size="lg"
          >
            Verify
          </Button>

          {!authLoading && user !== null && (
            <Button
              variant="secondary"
              onClick={() => navigate("/")}
              style={{ marginTop: "8px" }}
            >
              Cancel / Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
