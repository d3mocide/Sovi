import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { TotpPage } from "./pages/TotpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { theme } from "./theme";

import { SetupPage } from "./pages/SetupPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.colors.bg,
          color: theme.colors.textMuted,
          fontSize: "14px",
        }}
      >
        Loading…
      </div>
    );
  }
  if (initialized === false) return <Navigate to="/setup" replace />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { user, loading, initialized } = useAuth();
  if (loading) return null;
  if (initialized === false) return <Navigate to="/setup" replace />;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function SetupRoute() {
  const { loading, initialized } = useAuth();
  if (loading) return null;
  if (initialized === true) return <Navigate to="/login" replace />;
  return <SetupPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/totp" element={<TotpPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route
          path="/accounts"
          element={
            <Protected>
              <AccountsPage />
            </Protected>
          }
        />
        <Route
          path="/simulator"
          element={
            <Protected>
              <SimulatorPage />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <SettingsPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
