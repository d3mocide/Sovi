import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

interface User {
  user_id: string;
  email: string;
  display_name: string | null;
  totp_enabled: boolean;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean | null;
}

interface LoginResult {
  totp_required: boolean;
  message?: string;
}

interface TotpEnrollResult {
  secret: string;
  uri: string;
}

interface TotpVerifyResult {
  verified: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: null,
  });

  const fetchMe = useCallback(async () => {
    try {
      const { is_initialized } = await api.get<{ is_initialized: boolean }>(
        "/auth/setup-status"
      );
      let user: User | null = null;
      try {
        user = await api.get<User>("/auth/me");
      } catch {
        // User not logged in
      }
      setState({ user, loading: false, initialized: is_initialized });
    } catch {
      setState({ user: null, loading: false, initialized: true });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await api.post<LoginResult>("/auth/login", { email, password });
      return result;
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string): Promise<void> => {
      await api.post("/auth/register", {
        email,
        password,
        display_name: displayName,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setState({ user: null, loading: false, initialized: state.initialized });
  }, [state.initialized]);

  const enrollTotp = useCallback(async (): Promise<TotpEnrollResult> => {
    return api.post<TotpEnrollResult>("/auth/totp/enroll");
  }, []);

  const verifyTotp = useCallback(
    async (code: string): Promise<TotpVerifyResult> => {
      const result = await api.post<TotpVerifyResult>("/auth/totp/verify", { code });
      if (result.verified) {
        await fetchMe();
      }
      return result;
    },
    [fetchMe]
  );

  const disableTotp = useCallback(async (): Promise<User> => {
    const result = await api.post<User>("/auth/totp/disable");
    await fetchMe();
    return result;
  }, [fetchMe]);

  return {
    user: state.user,
    loading: state.loading,
    initialized: state.initialized,
    login,
    register,
    logout,
    enrollTotp,
    verifyTotp,
    disableTotp,
    refreshAuth: fetchMe,
  };
}
