import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the input. */
  label?: string;
  /** Error message — turns the border amber and shows the text below. */
  error?: string;
  /** Helper text shown below when there is no error. */
  hint?: string;
}

/**
 * Labelled text field with a sunken cool fill and sky focus ring. Errors are
 * amber, never red.
 *
 * @startingPoint section="Forms" subtitle="Labelled field with focus & error states" viewport="700x200"
 */
export const Input: React.ForwardRefExoticComponent<
  InputProps & React.RefAttributes<HTMLInputElement>
>;
