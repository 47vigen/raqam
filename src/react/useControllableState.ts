import { useCallback, useRef, useState } from "react";

// Locally declared so the dev-only gate type-checks without @types/node.
declare const process: { env?: Record<string, string | undefined> } | undefined;

interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

type ControllableSetter<T> = (next: T | ((prev: T | undefined) => T)) => void;

/**
 * Manages controlled vs uncontrolled state.
 * - If `value` is provided, the component is controlled.
 * - Otherwise it manages its own state starting from `defaultValue`.
 * Warns in dev mode if the component switches between controlled/uncontrolled.
 *
 * Overloads narrow the returned value to `T` (no `| undefined`) when a `value`
 * or `defaultValue` is supplied, so callers that guarantee one don't have to
 * null-check the result.
 */
export function useControllableState<T>(options: {
  value: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}): [T, ControllableSetter<T>];
export function useControllableState<T>(options: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, ControllableSetter<T>];
export function useControllableState<T>(
  options: UseControllableStateOptions<T>
): [T | undefined, ControllableSetter<T>];
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T | undefined, ControllableSetter<T>] {
  const isControlled = value !== undefined;
  const wasControlled = useRef(isControlled);

  // Dev-only warning. The `process.env.NODE_ENV !== "production"` token is
  // statically replaced and the branch eliminated by production bundlers that
  // define NODE_ENV (and by raqam's minified build), so this ships zero bytes in
  // production. The `typeof process` / `process.env` guards keep it crash-safe
  // under raw-browser ESM and partial `process` shims — this runs on every
  // render, so a throw here would break rendering, not just an error path.
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production" &&
    wasControlled.current !== isControlled
  ) {
    console.warn("[raqam] Switching between controlled and uncontrolled. Pick one and keep it.");
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
