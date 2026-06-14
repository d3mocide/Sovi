import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

interface User {
  user_id: string;
  email: string;
  display_name: string | null;
  totp_enabled: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
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
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const fetchMe = useCallback(async () => {
    try {
      const user = await api.get<User>("/auth/me");
      setState({ user, loading: false });
    } catch {
      setState({ user: null, loading: false });
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

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setState({ user: null, loading: false });
  }, []);

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

  return {
    user: state.user,
    loading: state.loading,
    login,
    logout,
    enrollTotp,
    verifyTotp,
  };
}
