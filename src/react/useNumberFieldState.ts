import { useCallback, useMemo, useRef, useState } from "react";
import { createFormatter } from "../core/formatter.js";
import { createParser } from "../core/parser.js";
import type { ChangeReason, NumberFieldState, UseNumberFieldStateOptions } from "../core/types.js";
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
  const precision = Math.max(decimalPlaces(a), decimalPlaces(b));
  const factor = 10 ** precision;
  return Math.round(a * factor + b * factor) / factor;
}

function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  // Exponential form (e.g. "1e-7", "1.5e-7") — String() uses it below 1e-6.
  const eIdx = s.indexOf("e");
  if (eIdx !== -1) {
    const exp = Number(s.slice(eIdx + 1));
    const dotIdx = s.indexOf(".");
    const fracLen = dotIdx === -1 ? 0 : eIdx - dotIdx - 1;
    return Math.max(0, fracLen - exp);
  }
  const idx = s.indexOf(".");
  return idx === -1 ? 0 : s.length - idx - 1;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNumberFieldState(options: UseNumberFieldStateOptions): NumberFieldState {
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
    allowOutOfRange = false,
    validate,
    onRawChange,
    formatValue: customFormatValue,
  } = options;

  // When decimals are disallowed, force the formatter to 0 fraction digits so
  // currency / fixedDecimalScale never pad ".00" (which the dot-strip would then
  // re-read, exploding the value). See XF-2.
  const effMinFrac = allowDecimal ? minimumFractionDigits : 0;
  const effMaxFrac = allowDecimal ? maximumFractionDigits : 0;
  const effFixedScale = allowDecimal ? fixedDecimalScale : false;

  // ── Formatter & parser (re-created only when deps change) ──────────────────
  const formatter = useMemo(
    () =>
      createFormatter({
        locale,
        formatOptions,
        prefix,
        suffix,
        minimumFractionDigits: effMinFrac,
        maximumFractionDigits: effMaxFrac,
        fixedDecimalScale: effFixedScale,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      locale,
      // JSON-serialize to detect object identity changes
      JSON.stringify(formatOptions),
      prefix,
      suffix,
      effMinFrac,
      effMaxFrac,
      effFixedScale,
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
    [locale, JSON.stringify(formatOptions), allowNegative, allowDecimal, prefix, suffix]
  );

  // ── Controlled/uncontrolled numeric value ──────────────────────────────────
  const [numberValue, setNumberValue] = useControllableState<number | null>({
    value: options.value,
    defaultValue: options.defaultValue ?? null,
    onChange: options.onChange,
  });

  // Last numeric value we emitted ourselves — used to tell our own onChange echo
  // apart from a genuine external controlled-value change (see sync block below).
  const lastEmittedRef = useRef<number | null | undefined>(
    options.value ?? options.defaultValue ?? null
  );

  // ── Display string ─────────────────────────────────────────────────────────
  // Stored in local state — can transiently diverge from numberValue
  // (e.g. while typing "1." which isn't a valid JS number yet)
  const formatDisplay = useCallback(
    (n: number): string =>
      // Normalise -0 so it never renders as "-0" on any path (mount included).
      customFormatValue
        ? customFormatValue(Object.is(n, -0) ? 0 : n)
        : formatter.format(Object.is(n, -0) ? 0 : n),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formatter, customFormatValue]
  );

  const initialDisplay = useMemo(() => {
    if (options.defaultValue != null) {
      return formatDisplay(options.defaultValue);
    }
    if (options.value != null) {
      return formatDisplay(options.value);
    }
    return "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const [inputValue, setInputValueRaw] = useState<string>(initialDisplay);

  // Track last formatted value so we can sync controlled value changes
  const lastFormattedRef = useRef<string>(initialDisplay);

  // ── Raw value (precision-preserving string) ────────────────────────────────
  const [rawValue, setRawValueState] = useState<string | null>(
    options.defaultValue != null ? String(options.defaultValue) : null
  );

  // ── Validation state ───────────────────────────────────────────────────────
  const runValidation = useCallback(
    (
      val: number | null
    ): { validationState: "valid" | "invalid"; validationError: string | null } => {
      if (!validate) return { validationState: "valid", validationError: null };
      const result = validate(val);
      if (result === false) return { validationState: "invalid", validationError: null };
      if (typeof result === "string")
        return { validationState: "invalid", validationError: result };
      return { validationState: "valid", validationError: null };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validate]
  );

  const initialValidation = useMemo(() => {
    const initVal = options.defaultValue ?? options.value ?? null;
    return runValidation(initVal != null ? initVal : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const [validationState, setValidationState] = useState<"valid" | "invalid">(
    initialValidation.validationState
  );
  const [validationError, setValidationError] = useState<string | null>(
    initialValidation.validationError
  );

  // ── isScrubbing / isFocused state ──────────────────────────────────────────
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ── Change reason ref (no re-render needed) ────────────────────────────────
  const lastChangeReasonRef = useRef<ChangeReason>("input");
  const _setLastChangeReason = useCallback((reason: ChangeReason) => {
    lastChangeReasonRef.current = reason;
  }, []);

  const _getLastChangeReason = useCallback((): ChangeReason => {
    return lastChangeReasonRef.current;
  }, []);

  // ── Sync controlled value → display string when value changes externally ───
  // We must distinguish a *genuine* external change (parent set a new value,
  // form reset/prefill, etc.) from the echo of our own onChange. `lastEmittedRef`
  // tracks the value we last emitted; if the incoming controlled value differs
  // from it, the change came from outside and the display must be re-synced.
  const externalValue = options.value;
  const prevExternalValueRef = useRef(externalValue);
  // Object.is (not !==) so a controlled value of NaN compares equal to itself
  // and never triggers an unconditional render-phase setState → infinite loop.
  if (!Object.is(prevExternalValueRef.current, externalValue)) {
    prevExternalValueRef.current = externalValue;
    if (!Object.is(externalValue, lastEmittedRef.current)) {
      lastEmittedRef.current = externalValue;
      // Normalise -0 so a controlled value of -0 displays as "0", matching the
      // typed and commit paths.
      const ev = Object.is(externalValue, -0) ? 0 : externalValue;
      const finite = ev != null && Number.isFinite(ev);
      const formatted = finite ? formatDisplay(ev as number) : "";
      lastFormattedRef.current = formatted;
      setInputValueRaw(formatted);
      setRawValueState(finite ? String(ev) : null);
    }
  }

  // ── Reformat the display when locale / formatOptions change at runtime ──────
  // When the field is not being actively edited, a locale or format change must
  // re-render the existing value in the new format (e.g. switching en-US → de-DE).
  const formatKey = `${locale ?? ""}|${JSON.stringify(formatOptions ?? {})}|${prefix ?? ""}|${suffix ?? ""}|${effMinFrac ?? ""}|${effMaxFrac ?? ""}|${effFixedScale ?? ""}`;
  const prevFormatKeyRef = useRef(formatKey);
  if (prevFormatKeyRef.current !== formatKey) {
    prevFormatKeyRef.current = formatKey;
    if (numberValue != null && Number.isFinite(numberValue) && !isFocused) {
      const formatted = formatDisplay(numberValue);
      if (formatted !== inputValue) {
        setInputValueRaw(formatted);
        lastFormattedRef.current = formatted;
      }
    }
  }

  // ── Internal helper: apply validation after a value change ────────────────
  const applyValidation = useCallback(
    (val: number | null) => {
      const { validationState: vs, validationError: ve } = runValidation(val);
      setValidationState(vs);
      setValidationError(ve);
    },
    [runValidation]
  );

  // ── setInputValue ──────────────────────────────────────────────────────────
  // `knownValue` lets the caller supply the exact numeric value when `val` is a
  // formatted string the parser cannot faithfully reverse (compact "2.5K",
  // scientific, unit). Without it, the value is derived by parsing `val`.
  const setInputValue = useCallback(
    (val: string, knownValue?: number | null) => {
      const value = knownValue !== undefined ? knownValue : parser.parse(val).value;

      // Strict clamping: reject input that goes out of range (skipped when allowOutOfRange)
      if (clampBehavior === "strict" && !allowOutOfRange && value !== null) {
        if (minValue !== undefined && value < minValue) return;
        if (maxValue !== undefined && value > maxValue) return;
      }

      setInputValueRaw(val);
      lastEmittedRef.current = value;
      setNumberValue(value);
      // rawValue tracks what user typed, not the formatted output
      setRawValueState(value !== null ? val : null);
      onRawChange?.(value !== null ? val : null);
      applyValidation(value);
    },
    [
      parser,
      clampBehavior,
      allowOutOfRange,
      minValue,
      maxValue,
      setNumberValue,
      onRawChange,
      applyValidation,
    ]
  );

  // ── setNumberValue (external) ──────────────────────────────────────────────
  const setNumericValue = useCallback(
    (val: number | null) => {
      lastEmittedRef.current = val;
      setNumberValue(val);
      if (val != null) {
        const formatted = formatDisplay(val);
        setInputValueRaw(formatted);
        lastFormattedRef.current = formatted;
        const rawStr = String(val);
        setRawValueState(rawStr);
        onRawChange?.(rawStr);
      } else {
        setInputValueRaw("");
        lastFormattedRef.current = "";
        setRawValueState(null);
        onRawChange?.(null);
      }
      applyValidation(val);
    },
    [formatDisplay, setNumberValue, onRawChange, applyValidation]
  );

  // ── commit (called on blur) ────────────────────────────────────────────────
  const commit = useCallback(() => {
    if (numberValue == null) {
      setInputValueRaw("");
      lastFormattedRef.current = "";
      return;
    }

    let clamped = numberValue;
    // Clamp on blur, unless allowOutOfRange is true
    if (clampBehavior === "blur" && !allowOutOfRange) {
      clamped = clamp(numberValue, minValue, maxValue);
    }
    // Normalise negative zero so "-0" commits as plain "0"
    if (Object.is(clamped, -0)) clamped = 0;

    const formatted = formatDisplay(clamped);
    setInputValueRaw(formatted);
    lastFormattedRef.current = formatted;

    // Round the committed value to the displayed precision so the numeric value
    // never diverges from what is shown (e.g. a percent field that rounds the
    // live-typed fraction down to its configured scale on blur). Only adopt the
    // reparsed value when it round-trips exactly back to `formatted` — this skips
    // non-invertible notations (compact "2.5K", scientific, unit) and any custom
    // formatter whose output the parser cannot faithfully reverse.
    let committed = clamped;
    if (!customFormatValue) {
      const reparsed = parser.parse(formatted).value;
      if (reparsed !== null && Number.isFinite(reparsed) && formatDisplay(reparsed) === formatted) {
        committed = reparsed;
      }
    }

    if (committed !== numberValue) {
      lastEmittedRef.current = committed;
      setNumberValue(committed);
    }
    applyValidation(committed);
  }, [
    numberValue,
    clampBehavior,
    allowOutOfRange,
    minValue,
    maxValue,
    parser,
    formatDisplay,
    customFormatValue,
    setNumberValue,
    applyValidation,
  ]);

  // Treat a non-finite value (NaN/Infinity from a bad default/controlled value)
  // as empty so it never reaches ARIA, the hidden form input, or arithmetic.
  const safeNumberValue = numberValue != null && Number.isFinite(numberValue) ? numberValue : null;

  // ── Step computation ───────────────────────────────────────────────────────
  const resolvedLargeStep = largeStep ?? step * 10;
  const resolvedSmallStep = smallStep ?? step * 0.1;

  const canIncrement =
    !options.disabled &&
    !options.readOnly &&
    (allowOutOfRange ||
      maxValue === undefined ||
      (safeNumberValue ?? Number.NEGATIVE_INFINITY) < maxValue);

  const canDecrement =
    !options.disabled &&
    !options.readOnly &&
    (allowOutOfRange ||
      minValue === undefined ||
      (safeNumberValue ?? Number.POSITIVE_INFINITY) > minValue);

  const increment = useCallback(
    (amount?: number) => {
      const s = amount ?? step;
      const base = safeNumberValue ?? 0;
      const raw = preciseAdd(base, s);
      const next = allowOutOfRange ? raw : clamp(raw, minValue, maxValue);
      setNumericValue(next);
    },
    [safeNumberValue, step, minValue, maxValue, allowOutOfRange, setNumericValue]
  );

  const decrement = useCallback(
    (amount?: number) => {
      const s = amount ?? step;
      const base = safeNumberValue ?? 0;
      const raw = preciseAdd(base, -s);
      const next = allowOutOfRange ? raw : clamp(raw, minValue, maxValue);
      setNumericValue(next);
    },
    [safeNumberValue, step, minValue, maxValue, allowOutOfRange, setNumericValue]
  );

  const incrementToMax = useCallback(() => {
    if (maxValue !== undefined) setNumericValue(maxValue);
  }, [maxValue, setNumericValue]);

  const decrementToMin = useCallback(() => {
    if (minValue !== undefined) setNumericValue(minValue);
  }, [minValue, setNumericValue]);

  return {
    inputValue,
    numberValue: safeNumberValue,
    rawValue,
    canIncrement,
    canDecrement,
    isScrubbing,
    setIsScrubbing,
    isFocused,
    setIsFocused,
    validationState,
    validationError,
    _setLastChangeReason,
    _getLastChangeReason,
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
