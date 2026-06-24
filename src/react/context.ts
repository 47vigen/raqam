import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { NumberFieldAria, NumberFieldState, UseNumberFieldProps } from "../core/types.js";

export interface NumberFieldContextValue {
  state: NumberFieldState;
  aria: NumberFieldAria;
  inputRef: RefObject<HTMLInputElement | null>;
  props: UseNumberFieldProps;
}

export const NumberFieldContext = createContext<NumberFieldContextValue | null>(null);

/**
 * Hook for sub-components to access the NumberField context.
 * Throws if used outside NumberField.Root.
 */
export function useNumberFieldContext(): NumberFieldContextValue {
  const ctx = useContext(NumberFieldContext);
  if (!ctx) {
    throw new Error("[raqam] NumberField sub-components must be used inside <NumberField.Root>.");
  }
  return ctx;
}
