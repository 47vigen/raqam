import type { FormatResult, LocaleInfo } from "./types.js";

// ── Internal ──────────────────────────────────────────────────────────────────

/** Probe value that will surface decimal AND grouping parts */
const PROBE_VALUE = 12345.6;

/**
 * LRU cache of Intl.NumberFormat instances, keyed by locale + JSON.stringify
 * (options). Bounded so apps that vary formatOptions at high cardinality —
 * per-row currencies in a large table, per-keystroke fraction-digit changes —
 * don't grow it without limit for the process lifetime.
 */
const FORMATTER_CACHE_MAX = 256;
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined
): Intl.NumberFormat {
  const key = `${locale ?? ""}::${JSON.stringify(options ?? {})}`;
  const cached = formatterCache.get(key);
  if (cached) {
    // Mark most-recently-used by re-inserting at the end of the Map's order.
    formatterCache.delete(key);
    formatterCache.set(key, cached);
    return cached;
  }
  const fmt = new Intl.NumberFormat(locale, options);
  formatterCache.set(key, fmt);
  // Evict the least-recently-used entry (the first key) when over capacity.
  if (formatterCache.size > FORMATTER_CACHE_MAX) {
    const oldest = formatterCache.keys().next().value;
    if (oldest !== undefined) formatterCache.delete(oldest);
  }
  return fmt;
}

/** Extract locale meta from formatToParts — never hardcoded. */
function extractLocaleInfo(
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined
): LocaleInfo {
  const styledFmt = getFormatter(locale, options);

  // Probe the separators with a NEUTRAL decimal formatter (same locale +
  // numbering system, but plain decimal style with a forced fraction). The
  // styled formatter can hide them — e.g. percent scales the probe so it has no
  // fraction (decimal separator invisible) and a positive value never yields a
  // minusSign. A negative, fractional decimal probe always surfaces all four.
  const probeFmt = getFormatter(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    numberingSystem: options?.numberingSystem,
  });
  const parts = probeFmt.formatToParts(-PROBE_VALUE);

  let decimalSeparator = ".";
  let groupingSeparator = ",";
  let minusSign = "-";
  let zero = "0";

  for (const part of parts) {
    if (part.type === "decimal") decimalSeparator = part.value;
    if (part.type === "group") groupingSeparator = part.value;
    if (part.type === "minusSign") minusSign = part.value;
  }

  // Detect locale zero digit
  for (const part of probeFmt.formatToParts(0)) {
    if (part.type === "integer") {
      zero = part.value;
      break;
    }
  }

  // RTL locales: Arabic / Hebrew / Persian / Urdu / Syriac etc.
  const rtlLocales = /^(ar|he|fa|ur|syc|nqo|ug|yi)/i;
  const resolvedLocale = styledFmt.resolvedOptions().locale;
  const isRTL = rtlLocales.test(resolvedLocale);

  return { decimalSeparator, groupingSeparator, minusSign, zero, isRTL };
}

// ── Factory ───────────────────────────────────────────────────────────────────

export interface FormatterOptions {
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  fixedDecimalScale?: boolean;
}

export interface Formatter {
  format(value: number): string;
  formatToParts(value: number): Intl.NumberFormatPart[];
  getLocaleInfo(): LocaleInfo;
  formatResult(value: number): FormatResult;
}

/**
 * Create a formatter instance. Intl.NumberFormat is cached — safe to call
 * on every render.
 */
export function createFormatter(opts: FormatterOptions): Formatter {
  // Merge fraction digit overrides into formatOptions
  const intlOptions: Intl.NumberFormatOptions = { ...opts.formatOptions };

  if (opts.minimumFractionDigits !== undefined) {
    intlOptions.minimumFractionDigits = opts.minimumFractionDigits;
  }
  if (opts.maximumFractionDigits !== undefined) {
    intlOptions.maximumFractionDigits = opts.maximumFractionDigits;
  }
  if (opts.fixedDecimalScale && opts.maximumFractionDigits !== undefined) {
    intlOptions.minimumFractionDigits = opts.maximumFractionDigits;
    intlOptions.maximumFractionDigits = opts.maximumFractionDigits;
  }

  const intlFmt = getFormatter(opts.locale, intlOptions);
  // Lazy — computed once on first call
  let cachedLocaleInfo: LocaleInfo | null = null;

  function getLocaleInfo(): LocaleInfo {
    if (!cachedLocaleInfo) {
      cachedLocaleInfo = extractLocaleInfo(opts.locale, intlOptions);
    }
    return cachedLocaleInfo;
  }

  function formatToParts(value: number): Intl.NumberFormatPart[] {
    const parts = intlFmt.formatToParts(value);
    if (!opts.prefix && !opts.suffix) return parts;

    const result: Intl.NumberFormatPart[] = [];
    if (opts.prefix) result.push({ type: "literal", value: opts.prefix });
    result.push(...parts);
    if (opts.suffix) result.push({ type: "literal", value: opts.suffix });
    return result;
  }

  function format(value: number): string {
    if (!Number.isFinite(value)) return "";
    const formatted = intlFmt.format(value);
    return (opts.prefix ?? "") + formatted + (opts.suffix ?? "");
  }

  function formatResult(value: number): FormatResult {
    const parts = formatToParts(value);
    const formatted = parts.map((p) => p.value).join("");
    return { formatted, parts };
  }

  return { format, formatToParts, getLocaleInfo, formatResult };
}
