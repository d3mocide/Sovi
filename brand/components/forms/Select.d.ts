import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

/**
 * Native <select> styled to match Input — deep sunken fill, custom chevron.
 * Use for account-type pickers and the payment-type toggle.
 */
export const Select: React.ForwardRefExoticComponent<
  SelectProps & React.RefAttributes<HTMLSelectElement>
>;
