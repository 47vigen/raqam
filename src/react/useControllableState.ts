import { useCallback, useRef, useState } from "react";

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

  if (
    typeof window !== "undefined" &&
    (window as unknown as { __DEV__?: boolean }).__DEV__ !== false
  ) {
    if (wasControlled.current !== isControlled) {
      console.warn(
        `[numra] Component is changing from ${
          wasControlled.current ? "controlled" : "uncontrolled"
        } to ${isControlled ? "controlled" : "uncontrolled"}. Decide between using a controlled or uncontrolled component and don't switch.`
      );
    }
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
