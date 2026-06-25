"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { computeNewCursorPosition } from "../core/cursor.js";
import { createFormatter, resolveEffectiveFractions } from "../core/formatter.js";
import { localizeDigits, normalizeDigits } from "../core/normalizer.js";
import { createParser } from "../core/parser.js";
import type { NumberFieldAria, NumberFieldState, UseNumberFieldProps } from "../core/types.js";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect.js";
import { usePressAndHold } from "./usePressAndHold.js";

// ── Tiny helper to safely escape regex special chars (including hyphen) ──────

function escapeRegex(s: string): string {
  // The hyphen is kept last in the character class so it reads as a literal
  // rather than a range indicator, no escape needed.
  return s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

/**
 * Track whether at least one element registered through the returned ref
 * callback is currently mounted. Lets `aria-labelledby` / `aria-describedby`
 * point at the label / description only while one truly exists — for any render
 * path (built-in component, custom primitive, or headless) — instead of
 * dangling at an element that isn't rendered. Ref-counted so multiple mounts and
 * StrictMode's double-invoke settle to the correct flag.
 */
function useMountedFlag(): [boolean, React.RefCallback<HTMLElement>] {
  const countRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const ref = useCallback<React.RefCallback<HTMLElement>>((node) => {
    if (node) {
      countRef.current += 1;
      setMounted(true);
    } else if (countRef.current > 0) {
      countRef.current -= 1;
      if (countRef.current === 0) setMounted(false);
    }
  }, []);
  return [mounted, ref];
}

/**
 * The focused element resolved through the node's *root* — `document` in the
 * light DOM, or the containing `ShadowRoot` when the field is inside a shadow
 * tree (where `document.activeElement` only reports the host). Falls back to
 * `document.activeElement` when no node is available.
 */
function activeElementWithin(node: Element | null): Element | null {
  const root = node?.getRootNode() as Document | ShadowRoot | undefined;
  if (root && "activeElement" in root) return root.activeElement;
  return typeof document !== "undefined" ? document.activeElement : null;
}

// Magnitude suffixes for compact-notation paste ("1.5K", "3.4M"). Module-scoped
// so it isn't rebuilt on every paste.
const MAGNITUDE_MULTIPLIERS: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  million: 1e6,
  b: 1e9,
  billion: 1e9,
  t: 1e12,
  trillion: 1e12,
};

/**
 * Parse scientific ("1e3", "1.23E4") and compact ("1.5K", "3.4M") notation that
 * the plain locale parser cannot handle. Used on paste so values copied from
 * spreadsheets / dashboards round-trip instead of being mangled by char-strip.
 * Returns null when `s` is not one of these forms.
 */
function parseSpecialNotation(s: string): number | null {
  // Bound length before the regexes (this runs on attacker-controllable paste
  // text). The patterns are also de-ambiguated below so they match in linear
  // time — together this closes the ReDoS on the paste path.
  if (s.length > 256) return null;
  const t = s.replace(/\s+/g, "");
  // Note the de-ambiguated mantissa `\d+(?:\.\d*)?|\.\d+` (no overlapping
  // `\d+\.?\d*` alternation) — the old form backtracked quadratically on a long
  // failing input.
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const m = t.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(k|m|b|t|thousand|million|billion|trillion)$/i);
  if (m) {
    const n = Number(m[1]) * MAGNITUDE_MULTIPLIERS[m[2].toLowerCase()]!;
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function useNumberField(
  props: UseNumberFieldProps,
  state: NumberFieldState,
  inputRef: React.RefObject<HTMLInputElement | null>
): NumberFieldAria {
  const {
    locale,
    formatOptions,
    minValue: rawMinValue,
    maxValue: rawMaxValue,
    allowNegative = true,
    allowDecimal = true,
    allowMouseWheel = false,
    liveFormat: rawLiveFormat = true,
    prefix,
    suffix,
    name,
    disabled,
    readOnly,
    required,
    onFocus,
    onBlur,
    maximumFractionDigits,
    minimumFractionDigits,
    fixedDecimalScale,
    copyBehavior = "formatted",
    stepHoldDelay = 400,
    stepHoldInterval = 200,
    incrementLabel = "Increase",
    decrementLabel = "Decrease",
    formatValue: customFormatValue,
    parseValue: customParseValue,
    onValueCommitted,
  } = props; // formatValue/parseValue are on UseNumberFieldStateOptions (inherited)

  // Drop non-finite bounds (mirrors useNumberFieldState) so aria-valuemin/max
  // never render "NaN"/"Infinity" and out-of-range / Home / End never act on a
  // bad bound.
  const minValue = Number.isFinite(rawMinValue) ? rawMinValue : undefined;
  const maxValue = Number.isFinite(rawMaxValue) ? rawMaxValue : undefined;

  // Compact/scientific/engineering notation produce formatted strings ("2.5K",
  // "1.5E3") whose suffix/exponent characters collide with continued typing, so
  // we keep the raw typed digits live and only format on blur/commit.
  const notation = formatOptions?.notation;
  const liveFormat =
    rawLiveFormat &&
    notation !== "compact" &&
    notation !== "scientific" &&
    notation !== "engineering";

  // Serialize formatOptions once per render — it feeds four useMemo dependency
  // arrays below and JSON.stringify is not free for non-trivial option objects.
  const formatOptionsKey = JSON.stringify(formatOptions);

  const { step = 1, largeStep = step * 10, smallStep = step * 0.1 } = state.options;

  const autoId = useId();
  const inputId = props.id ?? `raqam-${autoId}`;
  const labelId = `${inputId}-label`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  // ── Formatter & parser (kept in sync with state's) ──────────────────────
  // Same effective-fraction resolution as the state hook, via one shared helper,
  // so the live-typing and on-commit displays can never drift apart.
  const { effMinFrac, effMaxFrac, effFixedScale } = resolveEffectiveFractions({
    allowDecimal,
    minimumFractionDigits,
    maximumFractionDigits,
    fixedDecimalScale,
  });

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

  // Live-typing formatter: keeps grouping + currency symbol but drops the
  // minimum-fraction *padding* (".00") so currency / fixedDecimalScale fields
  // group correctly while typing and never accumulate padding zeros. The full
  // `formatter` (with padding) is applied on commit/blur.
  //
  // Percent fields default to maximumFractionDigits:0, which would round away
  // the fraction the user is typing ("12.5" → "13%") and — because the rounded
  // string is shorter — corrupt the next keystroke. Give the percent live
  // formatter room so typing never rounds; commit() rounds to the real scale.
  const isPercentStyle = formatOptions?.style === "percent";
  const liveMaxFrac = allowDecimal ? (isPercentStyle ? 20 : effMaxFrac) : 0;
  const liveFormatter = useMemo(
    () =>
      createFormatter({
        locale,
        formatOptions,
        prefix,
        suffix,
        minimumFractionDigits: 0,
        maximumFractionDigits: liveMaxFrac,
        fixedDecimalScale: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, formatOptionsKey, prefix, suffix, liveMaxFrac]
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

  // Re-format `value` so its integer part groups while the EXACT typed fraction
  // (incl. trailing zeros) from `source` is preserved. Returns null when there is
  // no integer part (leading-dot ".5" — keep it raw to avoid a "0" prepend that
  // would shift the caret) or no fraction (trailing dot). Used by the typing path
  // and the grouping-comma / trailing-affordance backspace paths so they all
  // preserve typed trailing zeros consistently.
  const formatGroupedFraction = useCallback(
    (value: number, source: string): string | null => {
      const info = formatter.getLocaleInfo();
      let decIdx = source.lastIndexOf(info.decimalSeparator);
      // Fall back to an ASCII "." only when it stands in for the decimal point
      // (not when "." is the grouping separator, e.g. de-DE — see Fix J).
      if (decIdx === -1 && info.decimalSeparator !== "." && info.groupingSeparator !== ".") {
        decIdx = source.lastIndexOf(".");
      }
      if (decIdx === -1) return null;
      if (!/\d/.test(normalizeDigits(source.slice(0, decIdx)))) return null; // leading dot
      const fracMatch = normalizeDigits(source.slice(decIdx + 1)).match(/^\d+/);
      if (!fracMatch) return null; // trailing dot
      const fracLen = Math.min(fracMatch[0].length, effMaxFrac ?? 20, 20);
      if (fracLen === 0) return null;
      return createFormatter({
        locale,
        formatOptions,
        prefix,
        suffix,
        minimumFractionDigits: fracLen,
        maximumFractionDigits: fracLen,
      }).format(value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formatter, locale, formatOptionsKey, prefix, suffix, effMaxFrac]
  );

  // ── Cursor engine ────────────────────────────────────────────────────────
  const pendingCursor = useRef<number | null>(null);

  // Stable handle to the latest state so listeners/effects that only *invoke*
  // state methods don't have to list the (per-render fresh) `state` object as a
  // dependency — keeps the native wheel listener from re-subscribing every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Restore cursor synchronously after React commits the new value to DOM
  useIsomorphicLayoutEffect(() => {
    if (
      pendingCursor.current !== null &&
      inputRef.current &&
      activeElementWithin(inputRef.current) === inputRef.current
    ) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
    // Run after every inputValue change
  }, [state.inputValue, inputRef]);

  // ── Mouse wheel (non-passive native listener) ────────────────────────────
  // React's synthetic onWheel is passive in React 17+; it cannot call
  // preventDefault(). We must attach a native, non-passive listener instead.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !allowMouseWheel) return;

    const handler = (e: WheelEvent) => {
      if (disabled || readOnly) return;
      if (activeElementWithin(el) !== el) return;
      e.preventDefault();
      const s = stateRef.current;
      s._setLastChangeReason("wheel");
      if (e.deltaY < 0) {
        s.increment();
      } else {
        s.decrement();
      }
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [allowMouseWheel, disabled, readOnly, inputRef]);

  // ── IME Composition state ────────────────────────────────────────────────
  // During CJK IME input, partial composed characters must not trigger live
  // formatting. We suspend formatting during composition and resume on end.
  const isComposing = useRef(false);

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposing.current = false;
      // After composition ends, run the full format cycle on the composed value
      const composedValue = e.currentTarget.value;
      const info = formatter.getLocaleInfo();
      const normalized = normalizeDigits(composedValue);

      let displayValue: string;
      // Thread the custom parser's value through to state — otherwise the state
      // hook re-derives it with the BUILT-IN parser, discarding the custom result.
      let composedKnownValue: number | null | undefined;
      if (customParseValue) {
        const result = customParseValue(normalized);
        // Honor an explicit null too (a custom parser rejecting the composed
        // text), so the built-in parser can't re-derive a value for it.
        composedKnownValue = result.value;
        if (result.isIntermediate) {
          displayValue = normalized;
        } else if (result.value !== null && customFormatValue) {
          displayValue = customFormatValue(result.value);
        } else if (result.value !== null) {
          displayValue = formatter.format(result.value);
        } else {
          displayValue = normalized;
        }
        // Disable cursor engine for custom format/parse
        pendingCursor.current = displayValue.length;
      } else if (liveFormat) {
        const result = parser.parse(normalized);
        if (result.isIntermediate) {
          // Keep the still-typing display in the locale's native digit script.
          displayValue = localizeDigits(normalized, info.zero);
        } else if (result.value !== null) {
          displayValue = customFormatValue
            ? customFormatValue(result.value)
            : liveFormatter.format(result.value);
        } else {
          displayValue = normalized === "" ? "" : normalized;
        }
        pendingCursor.current = computeNewCursorPosition(
          composedValue,
          composedValue.length,
          displayValue,
          info,
          "insertCompositionText"
        );
      } else {
        displayValue = normalized;
        pendingCursor.current = normalized.length;
      }

      state._setLastChangeReason("input");
      state.setInputValue(displayValue, composedKnownValue);
    },
    [formatter, liveFormatter, parser, liveFormat, state, customFormatValue, customParseValue]
  );

  // ── onChange handler ─────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInputValue = e.target.value;
      const cursorPos = e.target.selectionStart ?? rawInputValue.length;
      const inputType = (e.nativeEvent as InputEvent).inputType;
      const info = formatter.getLocaleInfo();

      // During IME composition, skip live formatting — just track the raw value
      if (isComposing.current) {
        state.setInputValue(rawInputValue);
        return;
      }

      // Normalise non-Latin digits
      let normalized = normalizeDigits(rawInputValue);

      // Drop characters disallowed by the constraint flags *live*, so the field
      // never shows an invalid string that gets wiped on blur. The minus / dot
      // keys simply do nothing instead of poisoning the value.
      if (!allowNegative) {
        normalized = normalized.split("-").join("").split(info.minusSign).join("");
      }
      if (!allowDecimal) {
        normalized = normalized.split(".").join("").split(info.decimalSeparator).join("");
      } else if (info.decimalSeparator !== "." && info.groupingSeparator !== ".") {
        // Latin-keyboard users type the ASCII "." as the decimal point even in
        // locales whose separator is non-ASCII (ar/fa: ٫). Map a "." that is part
        // of a number (adjacent to a digit) onto the locale separator so the value
        // parses and the caret engine (which only tracks the locale separator)
        // doesn't strand the dot. Dots inside a symbol (e.g. the Arabic currency
        // symbol "ج.م.") are NOT adjacent to digits, so they stay untouched.
        // Skipped entirely when "." is the grouping separator (e.g. de-DE).
        normalized = normalized.replace(/\./g, (_m, offset: number, str: string) =>
          /\d/.test(str[offset - 1] ?? "") || /\d/.test(str[offset + 1] ?? "")
            ? info.decimalSeparator
            : "."
        );
      }

      let displayValue: string;
      let knownValue: number | null | undefined;

      // Custom parse/format escape hatch
      if (customParseValue) {
        const result = customParseValue(normalized);
        // Thread the custom parser's value through to state — including an
        // explicit null (a custom parser that rejects input). Otherwise the
        // state hook re-parses the display with the BUILT-IN parser and could
        // emit a number the custom parser deliberately rejected.
        knownValue = result.value;
        if (result.isIntermediate) {
          displayValue = normalized;
        } else if (result.value !== null) {
          displayValue = customFormatValue
            ? customFormatValue(result.value)
            : formatter.format(result.value);
        } else if (normalized === "") {
          displayValue = "";
        } else {
          displayValue = normalized;
        }
        // Can't predict cursor position with custom formatter — place at end
        pendingCursor.current = displayValue.length;
      } else if (liveFormat) {
        const result = parser.parse(normalized);

        if (result.isIntermediate) {
          // A trailing-zero decimal (e.g. "12.50") is intermediate, but its
          // integer part should still group live (insert "99" into "$12.50" must
          // show "$9,912.50"). Re-format preserving the typed fraction; lone "-",
          // trailing "." and leading "." keep the raw form.
          const grouped =
            !customFormatValue && result.value !== null
              ? formatGroupedFraction(result.value, normalized)
              : null;
          displayValue = grouped ?? localizeDigits(normalized, info.zero);
        } else if (result.value !== null) {
          if (customFormatValue) {
            displayValue = customFormatValue(result.value);
          } else {
            displayValue = liveFormatter.format(result.value);
            // The display will be re-parsed by setInputValue. For invertible
            // formats that round-trips (and rounds the value to the displayed
            // precision); for non-invertible notation (compact "2.5K",
            // scientific, unit) re-parsing destroys magnitude — so pass the
            // exact typed value through when the format does not round-trip.
            const rt = parser.parse(displayValue).value;
            knownValue =
              rt !== null && Number.isFinite(rt) && liveFormatter.format(rt) === displayValue
                ? rt
                : result.value;
          }
        } else if (normalized === "" || !/\d/.test(normalized)) {
          // Empty, or only formatting affordances left (a lone "%", suffix, etc.
          // after deleting the last digit) — clear the field instead of stranding
          // the orphaned characters.
          displayValue = "";
        } else {
          // Invalid input — keep the raw normalised string so the user can
          // see what they typed (they'll get corrected on blur)
          displayValue = normalized;
        }

        if (customFormatValue) {
          // Custom format: can't predict cursor, place at end
          pendingCursor.current = displayValue.length;
        } else {
          // Compute and stash cursor position for the isomorphic layout effect
          pendingCursor.current = computeNewCursorPosition(
            rawInputValue,
            cursorPos,
            displayValue,
            info,
            inputType
          );
        }
      } else {
        // No live format — just pass through normalised digits
        displayValue = normalized;
        pendingCursor.current = cursorPos;
      }

      // An edit that empties the field reports the dedicated "clear" reason so
      // consumers can distinguish a deletion-to-empty from ordinary typing.
      state._setLastChangeReason(displayValue === "" ? "clear" : "input");
      state.setInputValue(displayValue, knownValue);
    },
    [
      formatter,
      liveFormatter,
      parser,
      liveFormat,
      state,
      customFormatValue,
      customParseValue,
      formatGroupedFraction,
    ]
  );

  // ── Paste handler ────────────────────────────────────────────────────────
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      // Discard absurdly long clipboard payloads up front — no legitimate number
      // is this long, and it bounds every downstream scan/regex on this
      // attacker-controllable input.
      if (text.length > 1000) return;

      // 1. Strip common currency symbols (global currencies)
      const stripped = text.replace(/[€$£¥₹₺₽﷼฿₩¢₦₨₪₫₱]/g, "").trim();

      // 2. Normalize non-Latin digits to ASCII
      let normalized = normalizeDigits(stripped);

      // Honour the constraint flags on paste too (drop minus / decimal).
      if (!allowNegative) {
        const li = formatter.getLocaleInfo();
        normalized = normalized.split("-").join("").split(li.minusSign).join("");
      }
      if (!allowDecimal) {
        const li = formatter.getLocaleInfo();
        normalized = normalized.split(".").join("").split(li.decimalSeparator).join("");
      }

      state._setLastChangeReason("paste");

      // Custom parse escape hatch
      if (customParseValue) {
        const result = customParseValue(normalized);
        if (result.value !== null) {
          const formatted = customFormatValue
            ? customFormatValue(result.value)
            : formatter.format(result.value);
          // Pass the known value so a non-invertible format (compact/scientific)
          // is not re-parsed into a wrong magnitude.
          state.setInputValue(formatted, result.value);
          pendingCursor.current = formatted.length;
        }
        return;
      }

      // 2.5 Scientific / compact notation (1e3, 1.23E4, 1.5K…) before the
      // locale parser, whose char-strip would otherwise mangle the e / K.
      const special = parseSpecialNotation(normalized);
      if (special !== null) {
        const isPercent = formatOptions?.style === "percent";
        const sval = isPercent ? special / 100 : special;
        const formatted = customFormatValue ? customFormatValue(sval) : formatter.format(sval);
        state.setInputValue(formatted, sval);
        pendingCursor.current = formatted.length;
        return;
      }

      // 3. Try parse with current locale parser
      const result = parser.parse(normalized);

      if (result.value !== null) {
        const formatted = formatter.format(result.value);
        state.setInputValue(formatted, result.value);
        pendingCursor.current = formatted.length;
        return;
      }

      // 4. Fallback: strip everything except digits, locale decimal, minus sign
      const localeInfo = formatter.getLocaleInfo();
      const allowedCharsPattern = new RegExp(
        `[^0-9${escapeRegex(localeInfo.decimalSeparator)}${escapeRegex(localeInfo.minusSign)}-]`,
        "g"
      );
      const stripped2 = normalized.replace(allowedCharsPattern, "");
      const result2 = parser.parse(stripped2);

      if (result2.value !== null) {
        const formatted = formatter.format(result2.value);
        state.setInputValue(formatted, result2.value);
        pendingCursor.current = formatted.length;
      }
      // If still invalid, silently discard — don't paste garbage into the field
    },
    [parser, formatter, state, customFormatValue, customParseValue]
  );

  // ── Copy / Cut handlers ──────────────────────────────────────────────────
  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (copyBehavior === "formatted") return; // browser handles it natively

      e.preventDefault();
      const text = String(state.numberValue ?? "");
      e.clipboardData.setData("text/plain", text);
    },
    [copyBehavior, state.numberValue]
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (copyBehavior === "formatted") return; // browser handles it

      e.preventDefault();
      const text = String(state.numberValue ?? "");
      e.clipboardData.setData("text/plain", text);
      // Clear the field after cut — report the dedicated "clear" reason.
      state._setLastChangeReason("clear");
      state.setInputValue("");
    },
    [copyBehavior, state]
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      const key = e.key;

      // Smart backspace: when cursor is immediately after a grouping separator
      // (no selection active, no modifier keys), delete both the separator and
      // the preceding digit so the user can backspace through formatted numbers
      // without the comma "blocking" deletion.
      //
      // This must be handled in keydown — by the time onChange fires, the
      // browser has already removed the separator character, making it
      // impossible to detect what was deleted.
      // Smart decimal: when the user types the decimal separator but one already
      // exists in the formatted value (e.g. "1.00" with fixedDecimalScale),
      // move the cursor to just after the decimal separator instead of inserting
      // a duplicate. This enables the financial UX pattern:
      //   "1.00" → type "." → cursor jumps after "." → type "5" → "1.50"
      // Same applies for negative values: "-1.00" → type "." → cursor after "."
      if (!e.metaKey && !e.ctrlKey && !e.altKey && allowDecimal) {
        const localeInfo = formatter.getLocaleInfo();
        // Match the locale's decimal separator key (e.g. "." for en-US, "," for
        // de-DE), plus the ASCII "." when it stands in for a non-ASCII separator
        // (ar/fa). Do NOT match "." when it is the grouping separator (de-DE).
        const isDecimalKey =
          key === localeInfo.decimalSeparator ||
          (key === "." &&
            localeInfo.decimalSeparator !== "." &&
            localeInfo.groupingSeparator !== ".");
        if (isDecimalKey) {
          const input = inputRef.current;
          if (input) {
            const decPos = input.value.indexOf(localeInfo.decimalSeparator);
            if (decPos !== -1) {
              e.preventDefault();
              input.setSelectionRange(decPos + 1, decPos + 1);
              return;
            }
          }
        }
      }

      if (key === "Backspace" && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const input = inputRef.current;
        if (input) {
          const cursor = input.selectionStart ?? 0;
          const selEnd = input.selectionEnd ?? cursor;
          const currentValue = input.value;
          const info = formatter.getLocaleInfo();

          if (
            cursor === selEnd && // no text selection — single caret
            cursor >= 2 &&
            currentValue[cursor - 1] === info.groupingSeparator
          ) {
            e.preventDefault();
            // Remove the grouping separator (cursor-1) AND the digit before it (cursor-2)
            const rawEdited = currentValue.slice(0, cursor - 2) + currentValue.slice(cursor);
            const parseResult = parser.parse(rawEdited);

            state._setLastChangeReason("input");
            let nextDisplay: string;
            if (parseResult.value !== null) {
              // Preserve typed trailing zeros; use the LIVE formatter (no
              // min-fraction padding) so editing matches the typing display.
              nextDisplay =
                formatGroupedFraction(parseResult.value, rawEdited) ??
                liveFormatter.format(parseResult.value);
              state.setInputValue(nextDisplay, parseResult.value);
            } else {
              // Empty or intermediate — store as-is (blur will clean up). If the
              // edit emptied the field, report the dedicated "clear" reason.
              nextDisplay = rawEdited;
              if (rawEdited === "") state._setLastChangeReason("clear");
              state.setInputValue(rawEdited);
            }
            // Remap the caret through the cursor engine so re-grouping shifts
            // (e.g. "1,234,567" → "123,567") never leave it stranded after a comma.
            pendingCursor.current = computeNewCursorPosition(
              rawEdited,
              cursor - 2,
              nextDisplay,
              info,
              "deleteContentBackward"
            );
            return;
          }

          // Backspace over a trailing affordance (% sign, suffix like " kg") —
          // the browser would delete the affordance char, but the formatter
          // immediately re-appends it, so the field never changes. Instead delete
          // the digit that precedes the affordance run. Digit detection is
          // script-aware (\p{Nd}) so it works for native digits (fa/ar) too.
          const isDigitChar = (ch: string | undefined): boolean =>
            ch !== undefined && /\p{Nd}/u.test(ch);
          const isAffordanceChar = (ch: string | undefined): boolean =>
            ch !== undefined &&
            !isDigitChar(ch) &&
            ch !== info.decimalSeparator &&
            ch !== info.minusSign &&
            ch !== "-";
          if (
            cursor === selEnd &&
            cursor === currentValue.length &&
            cursor >= 1 &&
            isAffordanceChar(currentValue[cursor - 1])
          ) {
            // Walk back over the trailing affordance run to the last real char.
            let i = cursor;
            while (i > 0 && isAffordanceChar(currentValue[i - 1])) i--;
            if (i > 0 && isDigitChar(currentValue[i - 1])) {
              e.preventDefault();
              const rawEdited = currentValue.slice(0, i - 1) + currentValue.slice(i);
              const parseResult = parser.parse(rawEdited);
              state._setLastChangeReason("input");
              let nextDisplay: string;
              if (parseResult.value !== null && /\p{Nd}/u.test(rawEdited)) {
                // Use the LIVE formatter (no min-fraction padding) so the display
                // matches the typing path — never re-pad ".00" mid-edit.
                nextDisplay =
                  formatGroupedFraction(parseResult.value, rawEdited) ??
                  liveFormatter.format(parseResult.value);
                state.setInputValue(nextDisplay, parseResult.value);
              } else {
                // No digits left — clear the field (don't strand the affordance).
                // Report the dedicated "clear" reason like the onChange path.
                nextDisplay = "";
                state._setLastChangeReason("clear");
                state.setInputValue("");
              }
              pendingCursor.current = computeNewCursorPosition(
                rawEdited,
                i - 1,
                nextDisplay,
                info,
                "deleteContentBackward"
              );
              return;
            }
          }
        }
      }

      if (key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
        const direction = key === "ArrowUp" ? 1 : -1;
        state._setLastChangeReason("keyboard");
        if (e.shiftKey) {
          direction > 0 ? state.increment(largeStep) : state.decrement(largeStep);
        } else if (e.metaKey || e.ctrlKey) {
          direction > 0 ? state.increment(smallStep) : state.decrement(smallStep);
        } else {
          direction > 0 ? state.increment() : state.decrement();
        }
        return;
      }

      if (key === "PageUp") {
        e.preventDefault();
        state._setLastChangeReason("keyboard");
        state.increment(largeStep);
        return;
      }

      if (key === "PageDown") {
        e.preventDefault();
        state._setLastChangeReason("keyboard");
        state.decrement(largeStep);
        return;
      }

      if (key === "Home") {
        if (minValue !== undefined) {
          e.preventDefault();
          state._setLastChangeReason("keyboard");
          state.decrementToMin();
        }
        return;
      }

      if (key === "End") {
        if (maxValue !== undefined) {
          e.preventDefault();
          state._setLastChangeReason("keyboard");
          state.incrementToMax();
        }
        return;
      }

      if (key === "Enter") {
        state._setLastChangeReason("blur");
        const committed = state.commit();
        onValueCommitted?.(committed, { reason: "keyboard" });
        return;
      }
    },
    [
      disabled,
      readOnly,
      state,
      largeStep,
      smallStep,
      minValue,
      maxValue,
      formatter,
      liveFormatter,
      parser,
      inputRef,
      allowDecimal,
      formatGroupedFraction,
      onValueCommitted,
    ]
  );

  // ── Blur handler ─────────────────────────────────────────────────────────
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      state.setIsFocused(false);
      state._setLastChangeReason("blur");
      const committed = state.commit();
      onValueCommitted?.(committed, { reason: "blur" });
      onBlur?.(e);
    },
    [state, onBlur, onValueCommitted]
  );

  // ── Focus handler ────────────────────────────────────────────────────────
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      state.setIsFocused(true);
      onFocus?.(e);
    },
    [state, onFocus]
  );

  // ── Press-and-hold for increment/decrement buttons ───────────────────────
  const incrementHold = usePressAndHold(
    () => {
      state._setLastChangeReason("increment");
      state.increment();
    },
    {
      delay: stepHoldDelay,
      interval: stepHoldInterval,
      disabled: disabled || !state.canIncrement,
    }
  );

  const decrementHold = usePressAndHold(
    () => {
      state._setLastChangeReason("decrement");
      state.decrement();
    },
    {
      delay: stepHoldDelay,
      interval: stepHoldInterval,
      disabled: disabled || !state.canDecrement,
    }
  );

  // ── ARIA valuetext ───────────────────────────────────────────────────────
  const ariaValueText = useMemo(() => {
    if (state.numberValue == null) return undefined;
    return customFormatValue
      ? customFormatValue(state.numberValue)
      : formatter.format(state.numberValue);
  }, [state.numberValue, formatter, customFormatValue]);

  // ── RTL detection ────────────────────────────────────────────────────────
  const localeInfo = formatter.getLocaleInfo();

  // ── Out-of-range + validation detection (for aria-invalid + data-invalid) ─
  const isOutOfRange =
    state.numberValue !== null &&
    ((minValue !== undefined && state.numberValue < minValue) ||
      (maxValue !== undefined && state.numberValue > maxValue));

  const isInvalid = isOutOfRange || state.validationState === "invalid";

  // ── Prop maps ────────────────────────────────────────────────────────────

  // Track whether a label element is actually mounted. `labelProps.ref` (below)
  // registers/unregisters as it mounts, so `aria-labelledby` only points at the
  // label when it truly exists — for any render path (built-in component, custom
  // primitive, or fully headless), not just one that runs a specific effect.
  const [hasLabel, labelRef] = useMountedFlag();

  // Fall back to the internal label id only when the consumer hasn't supplied
  // their own accessible name AND a label is actually rendered. Defaulting to
  // `labelId` otherwise points `aria-labelledby` at a `<label>` that may not
  // exist (e.g. when only `aria-label` is passed), producing a dangling ref.
  const ariaLabelledBy =
    props["aria-labelledby"] ?? (props["aria-label"] ? undefined : hasLabel ? labelId : undefined);

  // Mirror the label registration for the description so the input's
  // aria-describedby points at <NumberField.Description> only while one is
  // actually mounted — avoiding a dangling reference (the same class of bug fixed
  // for aria-labelledby) when no description is rendered.
  const [hasDescription, descriptionRef] = useMountedFlag();

  // Combine the consumer's own aria-describedby with the internal description id
  // (when present) so the description is announced by assistive technology.
  const ariaDescribedBy =
    [props["aria-describedby"], hasDescription ? descriptionId : null].filter(Boolean).join(" ") ||
    undefined;

  const labelProps: NumberFieldAria["labelProps"] = {
    id: labelId,
    htmlFor: inputId,
    ref: labelRef,
  };

  const groupProps: React.HTMLAttributes<HTMLDivElement> = {
    role: "group",
    "aria-labelledby": ariaLabelledBy,
  };

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    id: inputId,
    type: "text",
    inputMode: "decimal",
    role: "spinbutton",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    "aria-label": props["aria-label"],
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-valuenow": state.numberValue ?? undefined,
    "aria-valuemin": minValue,
    "aria-valuemax": maxValue,
    "aria-valuetext": ariaValueText,
    "aria-disabled": disabled || undefined,
    "aria-readonly": readOnly || undefined,
    "aria-required": required || undefined,
    "aria-invalid": isInvalid ? true : undefined,
    "aria-errormessage": isInvalid && state.validationError ? errorId : undefined,
    disabled,
    readOnly,
    required,
    value: state.inputValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onPaste: handlePaste,
    onCopy: copyBehavior !== "formatted" ? handleCopy : undefined,
    onCut: copyBehavior !== "formatted" ? handleCut : undefined,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    // RTL: keep the number LTR and align it to the right in RTL contexts.
    // unicodeBidi "plaintext" auto-detects each run's direction, so the digits
    // stay LTR while an RTL suffix / Arabic currency name falls to its natural
    // side ("embed" forced the whole field LTR, mis-ordering those affordances).
    style: localeInfo.isRTL
      ? { direction: "ltr", textAlign: "right", unicodeBidi: "plaintext" }
      : undefined,
    // Data attributes for CSS styling
    "data-disabled": disabled ? "" : undefined,
    "data-readonly": readOnly ? "" : undefined,
    "data-required": required ? "" : undefined,
    "data-invalid": isInvalid ? "" : undefined,
    "data-rtl": localeInfo.isRTL ? "" : undefined,
  } as React.InputHTMLAttributes<HTMLInputElement>;

  const hiddenInputProps: React.InputHTMLAttributes<HTMLInputElement> | null = name
    ? {
        type: "hidden",
        name,
        value: state.numberValue ?? "",
        "aria-hidden": true,
      }
    : null;

  const incrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    type: "button",
    tabIndex: -1,
    "aria-label": incrementLabel,
    disabled: disabled || !state.canIncrement,
    // Press-and-hold handlers replace simple onClick
    ...incrementHold,
    "data-disabled": disabled || !state.canIncrement ? "" : undefined,
  } as React.ButtonHTMLAttributes<HTMLButtonElement>;

  const decrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    type: "button",
    tabIndex: -1,
    "aria-label": decrementLabel,
    disabled: disabled || !state.canDecrement,
    // Press-and-hold handlers replace simple onClick
    ...decrementHold,
    "data-disabled": disabled || !state.canDecrement ? "" : undefined,
  } as React.ButtonHTMLAttributes<HTMLButtonElement>;

  const descriptionProps: NumberFieldAria["descriptionProps"] = {
    id: descriptionId,
    ref: descriptionRef,
  };

  const errorMessageProps: React.HTMLAttributes<HTMLElement> = {
    id: errorId,
    role: "alert",
    "aria-live": "polite",
  } as React.HTMLAttributes<HTMLElement>;

  return {
    labelProps,
    groupProps,
    inputProps,
    hiddenInputProps,
    incrementButtonProps,
    decrementButtonProps,
    descriptionProps,
    errorMessageProps,
  };
}
