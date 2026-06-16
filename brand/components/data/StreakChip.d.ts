import * as React from "react";

export interface StreakChipProps {
  /** Current streak count. Goes emerald when > 0, muted at 0. */
  count: number;
  /** Short label ("On-time payments", "Daily syncs"). */
  label: string;
  /** Personal best; hidden when 0. */
  best?: number;
  style?: React.CSSProperties;
}

/**
 * Gamification badge — big mono count, label, optional "Best: N". Sovi's
 * rewards are calm encouragement, never guilt. Lay them in a scrolling row.
 */
export function StreakChip(props: StreakChipProps): JSX.Element;
