import type { RefObject } from "react";
import { createContext, useContext } from "react";
import type { NumberFieldAria, NumberFieldState, UseNumberFieldProps } from "../core/types.js";

// Locally declared so the dev-only gate type-checks without @types/node.
declare const process: { env?: Record<string, string | undefined> } | undefined;

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
    // Full guidance in dev; production bundlers strip the guarded branch and ship
    // only the short identifiable message below. The `typeof process` /
    // `process.env` guards keep it crash-safe under raw-browser ESM and partial
    // `process` shims; both sit on the eliminated side of the NODE_ENV token.
    if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
      throw new Error("[raqam] NumberField sub-components must be used inside <NumberField.Root>.");
    }
    throw new Error("[raqam] <NumberField.Root> missing");
  }
  return ctx;
}
