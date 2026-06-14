import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

export interface DebtProgress {
  account_id: string;
  name: string;
  current_balance: number;
  original_principal: number | null;
  peak_balance: number | null;
  progress_pct: number;
  payoff_month: number | null;
  apr: number | null;
}

export interface TrendPoint {
  date: string;
  total_balance: number;
}

export interface MilestoneBadge {
  id: string;
  type: string;
  label: string;
  achieved_at: string;
  meta: Record<string, unknown> | null;
}

export interface StreakInfo {
  type: string;
  current_count: number;
  longest: number;
  last_event_at: string | null;
}

export interface GamificationData {
  debt_free_date: string | null;
  days_until_debt_free: number | null;
  debt_progress: DebtProgress[];
  trend: TrendPoint[];
  total_current_debt: number;
  interest_saved: number;
  total_interest_with_plan: number;
  total_interest_baseline: number;
  milestones: MilestoneBadge[];
  milestone_count: number;
  streaks: StreakInfo[];
}

export function useGamification() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await api.get<GamificationData>("/gamification");
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load gamification data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refresh: loadData };
}
