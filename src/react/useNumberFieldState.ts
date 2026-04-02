import { useCallback, useMemo, useRef, useState } from "react";
import type { NumberFieldState, UseNumberFieldStateOptions } from "../core/types.js";
import { createFormatter } from "../core/formatter.js";
import { createParser } from "../core/parser.js";
import { useControllableState } from "./useControllableState.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min?: number, max?: number): number {
  let v = value;
  if (min !== undefined) v = Math.max(v, min);
  if (max !== undefined) v = Math.min(v, max);
  return v;
}

function preciseAdd(a: number, b: number): number {
  // Simple float precision fix — avoids 0.1 + 0.2 = 0.30000000000000004
  const precision = Math.max(
    decimalPlaces(a),
    decimalPlaces(b)
  );
  const factor = 10 ** precision;
  return Math.round(a * factor + b * factor) / factor;
}

function decimalPlaces(n: number): number {
  const s = String(n);
  const idx = s.indexOf(".");
  return idx === -1 ? 0 : s.length - idx - 1;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNumberFieldState(
  options: UseNumberFieldStateOptions
): NumberFieldState {
  const {
    locale,
    formatOptions,
    minValue,
    maxValue,
    step = 1,
    largeStep,
    smallStep,
    allowNegative = true,
    allowDecimal = true,
    maximumFractionDigits,
    minimumFractionDigits,
    fixedDecimalScale,
    clampBehavior = "blur",
    prefix,
    suffix,
  } = options;

  // ── Formatter & parser (re-created only when deps change) ──────────────────
  const formatter = useMemo(
    () =>
      createFormatter({
        locale,
        formatOptions,
        prefix,
        suffix,
        minimumFractionDigits,
        maximumFractionDigits,
        fixedDecimalScale,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      locale,
      // JSON-serialize to detect object identity changes
      JSON.stringify(formatOptions),
      prefix,
      suffix,
      minimumFractionDigits,
      maximumFractionDigits,
      fixedDecimalScale,
    ]
  );

  const parser = useMemo(
    () =>
      createParser({
        locale,
        formatOptions,
        allowNegative,
        allowDecimal,
        prefix,
        suffix,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      locale,
      JSON.stringify(formatOptions),
      allowNegative,
      allowDecimal,
      prefix,
      suffix,
    ]
  );

  // ── Controlled/uncontrolled numeric value ──────────────────────────────────
  const [numberValue, setNumberValue] = useControllableState<number | null>({
    value: options.value,
    defaultValue: options.defaultValue ?? null,
    onChange: options.onChange,
  });

  // ── Display string ─────────────────────────────────────────────────────────
  // Stored in local state — can transiently diverge from numberValue
  // (e.g. while typing "1." which isn't a valid JS number yet)
  const initialDisplay = useMemo(() => {
    if (options.defaultValue != null) {
      return formatter.format(options.defaultValue);
    }
    if (options.value != null) {
      return formatter.format(options.value);
    }
    return "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const [inputValue, setInputValueRaw] = useState<string>(initialDisplay);

  // Track last formatted value so we can sync controlled value changes
  const lastFormattedRef = useRef<string>(initialDisplay);

  // Sync controlled value → display string when value changes externally
  // (not when the user is typing)
  const externalValue = options.value;
  const prevExternalValueRef = useRef(externalValue);
  if (prevExternalValueRef.current !== externalValue) {
    prevExternalValueRef.current = externalValue;
    if (externalValue != null) {
      const formatted = formatter.format(externalValue);
      if (formatted !== lastFormattedRef.current) {
        lastFormattedRef.current = formatted;
        // Using a ref mutation here avoids an extra render cycle;
        // React will flush this synchronously in the current render.
        // We'll update display state in a useEffect-like pattern below.
      }
    } else {
      lastFormattedRef.current = "";
    }
  }

  // ── setInputValue ──────────────────────────────────────────────────────────
  const setInputValue = useCallback(
    (val: string) => {
      const result = parser.parse(val);

      // Strict clamping: reject input that goes out of range
      if (clampBehavior === "strict" && result.value !== null) {
        if (minValue !== undefined && result.value < minValue) return;
        if (maxValue !== undefined && result.value > maxValue) return;
      }

      setInputValueRaw(val);
      setNumberValue(result.value);
    },
    [parser, clampBehavior, minValue, maxValue, setNumberValue]
  );

  // ── setNumberValue (external) ──────────────────────────────────────────────
  const setNumericValue = useCallback(
    (val: number | null) => {
      setNumberValue(val);
      if (val != null) {
        const formatted = formatter.format(val);
        setInputValueRaw(formatted);
        lastFormattedRef.current = formatted;
      } else {
        setInputValueRaw("");
        lastFormattedRef.current = "";
      }
    },
    [formatter, setNumberValue]
  );

  // ── commit (called on blur) ────────────────────────────────────────────────
  const commit = useCallback(() => {
    if (numberValue == null) {
      setInputValueRaw("");
      lastFormattedRef.current = "";
      return;
    }

    let clamped = numberValue;
    if (clampBehavior === "blur") {
      clamped = clamp(numberValue, minValue, maxValue);
    }

    const formatted = formatter.format(clamped);
    setInputValueRaw(formatted);
    lastFormattedRef.current = formatted;

    if (clamped !== numberValue) {
      setNumberValue(clamped);
    }
  }, [numberValue, clampBehavior, minValue, maxValue, formatter, setNumberValue]);

  // ── Step computation ───────────────────────────────────────────────────────
  const resolvedLargeStep = largeStep ?? step * 10;
  const resolvedSmallStep = smallStep ?? step * 0.1;

  const canIncrement =
    !options.disabled &&
    !options.readOnly &&
    (maxValue === undefined || (numberValue ?? -Infinity) < maxValue);

  const canDecrement =
    !options.disabled &&
    !options.readOnly &&
    (minValue === undefined || (numberValue ?? Infinity) > minValue);

  const increment = useCallback(
    (amount?: number) => {
      const s = amount ?? step;
      const base = numberValue ?? 0;
      const next = clamp(preciseAdd(base, s), minValue, maxValue);
      setNumericValue(next);
    },
    [numberValue, step, minValue, maxValue, setNumericValue]
  );

  const decrement = useCallback(
    (amount?: number) => {
      const s = amount ?? step;
      const base = numberValue ?? 0;
      const next = clamp(preciseAdd(base, -s), minValue, maxValue);
      setNumericValue(next);
    },
    [numberValue, step, minValue, maxValue, setNumericValue]
  );

  const incrementToMax = useCallback(() => {
    if (maxValue !== undefined) setNumericValue(maxValue);
  }, [maxValue, setNumericValue]);

  const decrementToMin = useCallback(() => {
    if (minValue !== undefined) setNumericValue(minValue);
  }, [minValue, setNumericValue]);

  return {
    inputValue,
    numberValue: numberValue ?? null,
    canIncrement,
    canDecrement,
    setInputValue,
    setNumberValue: setNumericValue,
    commit,
    increment,
    decrement,
    incrementToMax,
    decrementToMin,
    options: {
      ...options,
      step,
      largeStep: resolvedLargeStep,
      smallStep: resolvedSmallStep,
    },
  };
}
