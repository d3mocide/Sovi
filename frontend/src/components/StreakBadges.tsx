import React from "react";
import { Card } from "./ui/Card";
import { theme } from "../theme";
import type { StreakInfo } from "../hooks/useGamification";

interface StreakBadgesProps {
  streaks: StreakInfo[];
}

const STREAK_LABELS: Record<string, string> = {
  on_time: "On-time payments",
  sync: "Daily syncs",
  no_new_debt: "No new debt",
};

const STREAK_ICONS: Record<string, string> = {
  on_time: "✓",
  sync: "↻",
  no_new_debt: "→",
};

export function StreakBadges({ streaks }: StreakBadgesProps) {
  if (streaks.length === 0) {
    return null;
  }

  return (
    <div>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.colors.textMuted,
          marginBottom: "12px",
        }}
      >
        Streaks
      </p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {streaks.map((streak) => (
          <Card
            key={streak.type}
            style={{
              padding: "14px 18px",
              minWidth: "120px",
              flexShrink: 0,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: streak.current_count > 0 ? theme.colors.positive : theme.colors.textMuted,
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {streak.current_count}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: theme.colors.textMuted,
                fontWeight: 500,
              }}
            >
              {STREAK_LABELS[streak.type] ?? streak.type}
            </div>
            {streak.longest > 0 && (
              <div
                style={{
                  fontSize: "10px",
                  color: theme.colors.textMuted,
                  opacity: 0.6,
                  marginTop: "4px",
                }}
              >
                Best: {streak.longest}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
