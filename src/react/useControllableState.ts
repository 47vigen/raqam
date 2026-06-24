import { useCallback, useRef, useState } from "react";

// Locally declared so the dev-only gate type-checks without @types/node.
declare const process: { env?: Record<string, string | undefined> } | undefined;

// Bundlers statically replace `process.env.NODE_ENV`, so the controlled/
// uncontrolled warning below is dropped from production builds. Falls back to
// "not production" when `process` is absent (raw-browser ESM), where surfacing a
// dev-style warning is acceptable.
const IS_PRODUCTION =
  typeof process !== "undefined" &&
  typeof process.env !== "undefined" &&
  process.env.NODE_ENV === "production";

interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

/**
 * Manages controlled vs uncontrolled state.
 * - If `value` is provided, the component is controlled.
 * - Otherwise it manages its own state starting from `defaultValue`.
 * Warns in dev mode if the component switches between controlled/uncontrolled.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [
  T | undefined,
  (next: T | ((prev: T | undefined) => T)) => void,
] {
  const isControlled = value !== undefined;
  const wasControlled = useRef(isControlled);

  if (!IS_PRODUCTION && wasControlled.current !== isControlled) {
    console.warn(
      `[raqam] Component is changing from ${
        wasControlled.current ? "controlled" : "uncontrolled"
      } to ${isControlled ? "controlled" : "uncontrolled"}. Decide between using a controlled or uncontrolled component and don't switch.`
    );
  }

  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);

  const set = useCallback(
    (next: T | ((prev: T | undefined) => T)) => {
      const nextValue =
        typeof next === "function"
          ? (next as (prev: T | undefined) => T)(isControlled ? value : internalValue)
          : next;

      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isControlled, value, internalValue, onChange]
  );

  return [isControlled ? value : internalValue, set];
}
