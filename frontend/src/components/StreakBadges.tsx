import React from "react";
import { Card } from "./ui/Card";
import { Eyebrow, Numeral } from "./ui/Stat";
import { Icon, type IconName } from "./ui/Icon";
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

// Brand: icons are Lucide only — never Unicode glyphs (was ✓ ↻ →).
const STREAK_ICONS: Record<string, IconName> = {
  on_time: "check",
  sync: "refresh",
  no_new_debt: "shield",
};

export function StreakBadges({ streaks }: StreakBadgesProps) {
  if (streaks.length === 0) {
    return null;
  }

  return (
    <div>
      <Eyebrow style={{ marginBottom: "12px" }}>Streaks</Eyebrow>
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {streaks.map((streak) => {
          const active = streak.current_count > 0;
          return (
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
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "8px",
                  color: active ? theme.colors.positive : theme.colors.textMuted,
                }}
              >
                <Icon name={STREAK_ICONS[streak.type] ?? "check"} size={18} />
              </div>
              <Numeral
                as="div"
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: active ? theme.colors.positive : theme.colors.textMuted,
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                {streak.current_count}
              </Numeral>
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
                  Best: <Numeral>{streak.longest}</Numeral>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
