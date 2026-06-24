import { createFormatter } from "./formatter.js";
import { normalizeDigits } from "./normalizer.js";
import type { LocaleInfo, ParseResult } from "./types.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Given an ASCII-normalised numeric string (`stripped` — digits, an optional
 * leading "-", and at most one "."), report whether it is a valid-but-incomplete
 * value that must NOT be reformatted while the user is still typing:
 *   "1."      trailing decimal separator
 *   "1.0"     trailing zero after decimal
 *   "1.50"    trailing zeros after decimal
 *   ".5"      leading decimal point (normalised to "0.5" only on blur)
 *
 * This runs on the *stripped* string, so grouping separators, prefixes,
 * suffixes and currency symbols never break the detection.
 */
function isIntermediateStripped(stripped: string, allowDecimal: boolean): boolean {
  if (!allowDecimal) return false;
  if (/^-0+$/.test(stripped)) return true; // "-0" — user may still type "-0.5"
  if (/\.$/.test(stripped)) return true; // "1.", "-1."
  if (/\.\d*0$/.test(stripped)) return true; // "1.0", "1.50", "1.230"
  if (/^-?\.\d+$/.test(stripped)) return true; // ".5", "-.5"
  return false;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export interface ParserOptions {
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface Parser {
  parse(input: string): ParseResult;
  isIntermediate(input: string): boolean;
  getLocaleInfo(): LocaleInfo;
  /**
   * Strip formatting affordances (grouping separators, currency symbol, prefix/
   * suffix, percent sign…) from `input`, returning the bare numeric string
   * (ASCII digits, an optional leading "-", and at most one "."). Trailing zeros
   * the user typed are preserved. Useful for deriving a precision-preserving raw
   * value from a formatted display string.
   */
  strip(input: string): string;
}

/**
 * Create a locale-aware parser. Separator characters are extracted from
 * Intl.NumberFormat — never hardcoded.
 */
export function createParser(opts: ParserOptions = {}): Parser {
  const allowNegative = opts.allowNegative ?? true;
  const allowDecimal = opts.allowDecimal ?? true;
  // Percent fields hold the *fraction* (Intl multiplies by 100 on display), so
  // typed digits must be divided by 100: typing "50" means 50% i.e. value 0.5.
  const isPercent = opts.formatOptions?.style === "percent";

  // Re-use the formatter to get locale info
  const fmt = createFormatter({
    locale: opts.locale,
    formatOptions: opts.formatOptions,
    prefix: opts.prefix,
    suffix: opts.suffix,
  });

  // The literal currency symbol (e.g. "$", "€", or Arabic "ج.م." which embeds
  // ASCII dots). Captured so it can be removed wholesale before separator
  // handling — otherwise its dots would be mistaken for a decimal point.
  let currencySymbol = "";
  if (opts.formatOptions?.style === "currency") {
    try {
      currencySymbol = fmt
        .formatToParts(1)
        .filter((p) => p.type === "currency")
        .map((p) => p.value)
        .join("");
    } catch {
      currencySymbol = "";
    }
  }

  function getLocaleInfo(): LocaleInfo {
    return fmt.getLocaleInfo();
  }

  function stripAffordances(raw: string): string {
    const info = getLocaleInfo();

    // 1. Normalise non-Latin digits to ASCII
    let s = normalizeDigits(raw);

    // 1b. Remove the currency symbol wholesale (before separators are touched),
    // so a symbol containing ASCII dots — e.g. Arabic "ج.م." — does not leave
    // stray "." that the numeric validation would reject.
    if (currencySymbol) {
      s = s.split(currencySymbol).join("");
    }

    // 2. Accounting format: "(1,234.56)" or "($1,234.56)" → negative
    // Intl.NumberFormat with currencySign:"accounting" wraps negatives in parens
    const accountingMatch = s.match(/^\((.+)\)$/);
    if (accountingMatch) {
      s = `-${accountingMatch[1]}`;
    }

    // 3. Strip prefix / suffix
    if (opts.prefix && s.startsWith(opts.prefix)) {
      s = s.slice(opts.prefix.length);
    }
    if (opts.suffix && s.endsWith(opts.suffix)) {
      s = s.slice(0, -opts.suffix.length);
    }

    // 4. Strip grouping separators  (escape special chars)
    if (info.groupingSeparator) {
      s = s.split(info.groupingSeparator).join("");
    }

    // 5. Replace locale decimal separator with ASCII "."
    if (info.decimalSeparator !== ".") {
      s = s.split(info.decimalSeparator).join(".");
    }

    // 6. Replace locale minus sign with ASCII "-"
    if (info.minusSign !== "-") {
      s = s.split(info.minusSign).join("-");
    }
    // Also normalise the Unicode minus U+2212 (used by fa/sv/fi/nb… and often
    // pasted) so it is never stripped as a non-numeric character below.
    if (s.includes("−")) {
      s = s.split("−").join("-");
    }

    // 7. Strip currency symbol, percent sign, spaces that Intl might prepend/append
    // Strip any remaining non-numeric chars except digits, ".", "-"
    // (handles currency prefixes/suffixes from Intl)
    s = s.replace(/[^\d.\-]/g, "").trim();

    // 8. Collapse minus signs to a single leading one, so stray minuses typed in
    // the middle ("1-23") or doubled ("--5") never invalidate the whole value.
    if (s.includes("-")) {
      const negative = s.startsWith("-");
      s = s.replace(/-/g, "");
      if (negative) s = `-${s}`;
    }

    return s;
  }

  function parse(input: string): ParseResult {
    if (!input || input.trim() === "") {
      return { value: null, isValid: false, isIntermediate: false };
    }

    // Strip *first*, so intermediate detection never trips over grouping
    // separators, prefixes, suffixes or currency symbols.
    const stripped = stripAffordances(input);

    if (stripped === "") {
      return { value: null, isValid: false, isIntermediate: false };
    }

    // Lone minus — intermediate only if negatives are allowed.
    if (stripped === "-") {
      return { value: null, isValid: false, isIntermediate: allowNegative };
    }

    // Lone decimal point ("." or "-.") — intermediate only if decimals allowed.
    if (stripped === "." || stripped === "-.") {
      return {
        value: null,
        isValid: false,
        isIntermediate: allowDecimal && (stripped === "." || allowNegative),
      };
    }

    if (!allowNegative && stripped.startsWith("-")) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    if (!allowDecimal && stripped.includes(".")) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    // Accept integers and decimals with the dot either trailing ("1.") or
    // leading (".5") so partially-typed values still yield a numeric value.
    if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(stripped)) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    let n = Number.parseFloat(stripped);
    if (!Number.isFinite(n)) {
      return { value: null, isValid: false, isIntermediate: false };
    }
    // Normalise negative zero so consumers never receive -0 from onChange.
    if (Object.is(n, -0)) n = 0;
    // Percent: divide by 100, snapping to canonical precision so the IEEE-754
    // division artifact (12.99/100 = 0.12990000000000002) never surfaces.
    if (isPercent && n !== 0) n = Number((n / 100).toPrecision(15));

    // A trailing-zero / trailing-dot / leading-dot value is still a real number
    // (so it is never wiped on blur) but must not be reformatted mid-typing.
    return {
      value: n,
      isValid: true,
      isIntermediate: isIntermediateStripped(stripped, allowDecimal),
    };
  }

  function isIntermediate(input: string): boolean {
    return parse(input).isIntermediate;
  }

  return { parse, isIntermediate, getLocaleInfo, strip: stripAffordances };
}
