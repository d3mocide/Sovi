import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

interface NextFocusDebt {
  account_id: string;
  name: string;
  balance: number;
  apr: number;
}

export interface DashboardData {
  total_debt: number;
  debt_free_date: string | null;
  days_until_debt_free: number | null;
  next_focus_debt: NextFocusDebt | null;
  on_time_streak: number;
  interest_saved: number;
  accounts_count: number;
  unclassified_count: number;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await api.get<DashboardData>("/dashboard");
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  return { data, loading, error, refresh: loadData };
}
