import { createFormatter } from "./formatter.js";
import { normalizeDigits } from "./normalizer.js";
import type { LocaleInfo, ParseResult } from "./types.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Escape a string so it can be used literally inside a RegExp.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns true if `s` represents a valid-but-incomplete number:
 *   "-"       lone minus
 *   "1."      trailing decimal separator (any locale)
 *   "1.0"     trailing zero after decimal
 *   "1.00"    etc.
 *
 * These should NOT be reformatted while the user is still typing.
 */
function checkIntermediate(
  normalized: string,
  info: LocaleInfo,
  allowNegative: boolean,
  allowDecimal: boolean
): boolean {
  const dec = escapeRegex(info.decimalSeparator);
  const minus = escapeRegex(info.minusSign);

  // Lone minus sign
  if (allowNegative && (normalized === "-" || normalized === info.minusSign)) {
    return true;
  }
  // Trailing decimal separator
  if (allowDecimal && new RegExp(`^${minus}?\\d+${dec}$`).test(normalized)) {
    return true;
  }
  // Trailing zeros after decimal  (e.g. "1.0", "1.00", "-1.0")
  if (allowDecimal && new RegExp(`^${minus}?\\d+${dec}\\d*0+$`).test(normalized)) {
    return true;
  }
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
}

/**
 * Create a locale-aware parser. Separator characters are extracted from
 * Intl.NumberFormat — never hardcoded.
 */
export function createParser(opts: ParserOptions = {}): Parser {
  const allowNegative = opts.allowNegative ?? true;
  const allowDecimal = opts.allowDecimal ?? true;

  // Re-use the formatter to get locale info
  const fmt = createFormatter({
    locale: opts.locale,
    formatOptions: opts.formatOptions,
    prefix: opts.prefix,
    suffix: opts.suffix,
  });

  function getLocaleInfo(): LocaleInfo {
    return fmt.getLocaleInfo();
  }

  function stripAffordances(raw: string): string {
    const info = getLocaleInfo();

    // 1. Normalise non-Latin digits to ASCII
    let s = normalizeDigits(raw);

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

    // 7. Strip currency symbol, percent sign, spaces that Intl might prepend/append
    // Strip any remaining non-numeric chars except digits, ".", "-"
    // (handles currency prefixes/suffixes from Intl)
    s = s.replace(/[^\d.\-]/g, "").trim();

    return s;
  }

  function parse(input: string): ParseResult {
    if (!input || input.trim() === "") {
      return { value: null, isValid: false, isIntermediate: false };
    }

    const info = getLocaleInfo();

    // Check for intermediate state before stripping
    if (checkIntermediate(input, info, allowNegative, allowDecimal)) {
      return { value: null, isValid: false, isIntermediate: true };
    }

    const stripped = stripAffordances(input);

    if (stripped === "") {
      return { value: null, isValid: false, isIntermediate: false };
    }

    if (stripped === "-") {
      // Lone minus after stripping — only intermediate if negatives are allowed
      return { value: null, isValid: false, isIntermediate: allowNegative };
    }

    // Reject if not a valid numeric string
    if (!/^-?\d+\.?\d*$/.test(stripped)) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    if (!allowNegative && stripped.startsWith("-")) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    if (!allowDecimal && stripped.includes(".")) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    const n = Number.parseFloat(stripped);
    if (!Number.isFinite(n)) {
      return { value: null, isValid: false, isIntermediate: false };
    }

    return { value: n, isValid: true, isIntermediate: false };
  }

  function isIntermediate(input: string): boolean {
    const info = getLocaleInfo();
    return checkIntermediate(input, info, allowNegative, allowDecimal);
  }

  return { parse, isIntermediate, getLocaleInfo };
}
