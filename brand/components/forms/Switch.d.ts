import * as React from "react";

export interface SwitchProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Optional trailing label. */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Quiet on/off toggle — sky track when on. For settings rows (2FA, auto-sync).
 */
export function Switch(props: SwitchProps): JSX.Element;
