import { useCallback, useMemo, useRef, useState } from "react";
import { createFormatter, resolveEffectiveFractions } from "../core/formatter.js";
import { createParser } from "../core/parser.js";
import type { ChangeReason, NumberFieldState, UseNumberFieldStateOptions } from "../core/types.js";
import { useControllableState } from "./useControllableState.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min?: number, max?: number): number {
  let v = value;
  // Ignore non-finite bounds (NaN/Infinity) — Math.max/Math.min would otherwise
  // return NaN and poison the committed value.
  if (min !== undefined && Number.isFinite(min)) v = Math.max(v, min);
  if (max !== undefined && Number.isFinite(max)) v = Math.min(v, max);
  return v;
}

function preciseAdd(a: number, b: number): number {
  // Float precision fix — avoids 0.1 + 0.2 = 0.30000000000000004. The scaling
  // trick is only valid while the scaled operands stay within Number.MAX_SAFE_
  // INTEGER (2^53). Fall back to plain addition when scaling would be unsafe:
  //  - precision > 15: the operands can't be represented at that scale; capping
  //    instead would round a tiny addend (e.g. 1e-20) to 0, dropping the step.
  //  - scaled operand exceeds MAX_SAFE_INTEGER: rounding can drop the step or
  //    move the value backwards.
  const precision = Math.max(decimalPlaces(a), decimalPlaces(b));
  if (precision > 15) return a + b;
  const factor = 10 ** precision;
  const sa = a * factor;
  const sb = b * factor;
  if (!Number.isSafeInteger(Math.round(sa)) || !Number.isSafeInteger(Math.round(sb))) {
    return a + b;
  }
  return Math.round(sa + sb) / factor;
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
    minValue: rawMinValue,
    maxValue: rawMaxValue,
    step: rawStep = 1,
    largeStep: rawLargeStep,
    smallStep: rawSmallStep,
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

  // Sanitize numeric config. A non-finite/non-positive step would emit NaN or
  // Infinity through increment/decrement (or dead-end stepping for 0), and
  // non-finite bounds would poison clamp and the committed value. Drop bad
  // values to safe defaults / undefined.
  const step = Number.isFinite(rawStep) && rawStep > 0 ? rawStep : 1;
  const minValue = Number.isFinite(rawMinValue) ? rawMinValue : undefined;
  const maxValue = Number.isFinite(rawMaxValue) ? rawMaxValue : undefined;

  // When decimals are disallowed, fraction padding/scale is forced to 0 so
  // currency / fixedDecimalScale never pad ".00" (which the dot-strip would then
  // re-read, exploding the value). Shared with useNumberField via one helper so
  // the editable and on-commit displays can never drift apart.
  const { effMinFrac, effMaxFrac, effFixedScale } = resolveEffectiveFractions({
    allowDecimal,
    minimumFractionDigits,
    maximumFractionDigits,
    fixedDecimalScale,
  });

  // Serialize formatOptions once per render — it feeds two useMemo dependency
  // arrays and the runtime-reformat key below, and JSON.stringify is not free
  // for non-trivial option objects.
  const formatOptionsKey = JSON.stringify(formatOptions ?? {});

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
    [locale, formatOptionsKey, prefix, suffix, effMinFrac, effMaxFrac, effFixedScale]
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
    [locale, formatOptionsKey, allowNegative, allowDecimal, prefix, suffix]
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

  // Mirror of the display string, updated SYNCHRONOUSLY before each setNumberValue
  // (which fires onChange). `inputValue` state only reflects the *previous* render
  // at onChange time, so consumers reading the formatted value via onValueChange
  // must read this ref to get the value that matches the just-emitted number.
  const latestDisplayRef = useRef<string>(initialDisplay);
  const _getLatestDisplay = useCallback((): string => latestDisplayRef.current, []);

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
      latestDisplayRef.current = formatted;
      setInputValueRaw(formatted);
      setRawValueState(finite ? String(ev) : null);
    }
  }

  // ── Reformat the display when locale / formatOptions change at runtime ──────
  // When the field is not being actively edited, a locale or format change must
  // re-render the existing value in the new format (e.g. switching en-US → de-DE).
  const formatKey = `${locale ?? ""}|${formatOptionsKey}|${prefix ?? ""}|${suffix ?? ""}|${effMinFrac ?? ""}|${effMaxFrac ?? ""}|${effFixedScale ?? ""}`;
  const prevFormatKeyRef = useRef(formatKey);
  if (prevFormatKeyRef.current !== formatKey) {
    prevFormatKeyRef.current = formatKey;
    if (numberValue != null && Number.isFinite(numberValue) && !isFocused) {
      const formatted = formatDisplay(numberValue);
      if (formatted !== inputValue) {
        setInputValueRaw(formatted);
        lastFormattedRef.current = formatted;
        latestDisplayRef.current = formatted;
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
      const parsed = parser.parse(val);
      const value = knownValue !== undefined ? knownValue : parsed.value;

      // Strict clamping: reject input that goes out of range (skipped when allowOutOfRange)
      if (clampBehavior === "strict" && !allowOutOfRange && value !== null) {
        if (minValue !== undefined && value < minValue) return;
        if (maxValue !== undefined && value > maxValue) return;
      }

      latestDisplayRef.current = val;
      setInputValueRaw(val);
      lastEmittedRef.current = value;
      setNumberValue(value);

      // rawValue is the *unformatted*, precision-preserving string — not the
      // grouped / currency-decorated display. Prefer the affordance-stripped form
      // (digits + "." + sign, trailing zeros intact) since it keeps the exact
      // digits the user typed — but only when it numerically denotes `value`.
      // strip() is NOT the inverse of parse() for rescaling styles (percent
      // divides typed digits by 100: "50%" strips to "50" but means 0.5) or for
      // non-invertible notation (compact "2.5K", scientific, unit, custom
      // formatters); there, fall back to the canonical numeric string.
      let raw: string | null = null;
      if (value !== null) {
        const stripped = parser.strip(val);
        if (/\d/.test(stripped) && Number(stripped) === value) {
          // `value` is -0-normalized everywhere, so never surface a "-0" raw.
          raw = value === 0 && stripped.startsWith("-") ? stripped.slice(1) : stripped;
        } else {
          raw = String(value);
        }
      }
      setRawValueState(raw);
      onRawChange?.(raw);
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
    (rawVal: number | null) => {
      // Never emit a non-finite value (NaN/Infinity) to onChange/ARIA/forms —
      // treat it as empty. A catch-all behind the config sanitization above.
      const val = rawVal !== null && !Number.isFinite(rawVal) ? null : rawVal;
      // Compute the display and update latestDisplayRef BEFORE setNumberValue, so
      // the onChange it triggers reports the matching formatted value (not the
      // previous render's).
      const formatted = val != null ? formatDisplay(val) : "";
      latestDisplayRef.current = formatted;
      lastEmittedRef.current = val;
      setNumberValue(val);
      setInputValueRaw(formatted);
      lastFormattedRef.current = formatted;
      if (val != null) {
        const rawStr = String(val);
        setRawValueState(rawStr);
        onRawChange?.(rawStr);
      } else {
        setRawValueState(null);
        onRawChange?.(null);
      }
      applyValidation(val);
    },
    [formatDisplay, setNumberValue, onRawChange, applyValidation]
  );

  // ── commit (called on blur) ────────────────────────────────────────────────
  const commit = useCallback((): number | null => {
    // Treat empty AND non-finite (NaN/Infinity from a bad controlled/default
    // value) as empty on commit, so blur/Enter never returns or emits a
    // non-finite value even though the field renders empty.
    if (numberValue == null || !Number.isFinite(numberValue)) {
      latestDisplayRef.current = "";
      setInputValueRaw("");
      lastFormattedRef.current = "";
      return null;
    }

    let clamped = numberValue;
    // Clamp on blur, unless allowOutOfRange is true
    if (clampBehavior === "blur" && !allowOutOfRange) {
      clamped = clamp(numberValue, minValue, maxValue);
    }
    // Normalise negative zero so "-0" commits as plain "0"
    if (Object.is(clamped, -0)) clamped = 0;

    const formatted = formatDisplay(clamped);
    latestDisplayRef.current = formatted;
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
    return committed;
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
  const resolvedLargeStep =
    Number.isFinite(rawLargeStep) && (rawLargeStep as number) > 0
      ? (rawLargeStep as number)
      : step * 10;
  const resolvedSmallStep =
    Number.isFinite(rawSmallStep) && (rawSmallStep as number) > 0
      ? (rawSmallStep as number)
      : step * 0.1;

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
    _getLatestDisplay,
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
      // Expose the sanitized bounds so every consumer (e.g. useScrubArea's
      // aria-valuemin/max) sees cleaned values, not raw NaN/Infinity.
      minValue,
      maxValue,
    },
  };
}
