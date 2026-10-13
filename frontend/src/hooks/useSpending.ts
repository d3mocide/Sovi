import { useEffect, useState } from "react";
import { api } from "../api/client";

export interface SpendingMonth {
  month: string; // YYYY-MM-01
  partial: boolean;
  income: number;
  cash_spend: number;
  card_charges: number;
  card_payments: number;
  spend: number;
  borrowing: number; // card charges - refunds - card payments; > 0 means card balances grew
}

export interface SpendingCategory {
  name: string;
  total: number;
  avg_month: number;
  by_month: Record<string, number>;
  card_share: number; // 0..1 of this category's spend that went on credit cards
}

export interface SpendingData {
  months: SpendingMonth[];
  categories: SpendingCategory[];
  uncategorized_share: number;
  learned_share: number;
  top_uncategorized_merchants: { merchant: string; total: number }[];
}

export function useSpending(months = 6) {
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api
      .get<SpendingData>(`/spending/monthly?months=${months}`)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Failed to load spending"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [months]);
  return { data, loading, error };
}
