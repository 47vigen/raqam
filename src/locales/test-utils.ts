/**
 * Shared utilities for locale integration tests.
 * NOT part of the public API — only imported from *.test.ts(x) files.
 */
import { createFormatter } from "../core/formatter.js";
import { createParser } from "../core/parser.js";
import type { LocaleInfo } from "../core/types.js";

// ── Formatter / parser helpers ────────────────────────────────────────────────

/**
 * Return the LocaleInfo for a given locale.
 * Useful for asserting separator characters without hard-coding them.
 */
export function getLocaleInfo(locale: string): LocaleInfo {
  return createFormatter({ locale }).getLocaleInfo();
}

/**
 * Format a number with the given locale.
 */
export function fmt(
  locale: string,
  value: number,
  formatOptions?: Intl.NumberFormatOptions
): string {
  return createFormatter({ locale, formatOptions }).format(value);
}

/**
 * Parse a formatted string back to a number using the given locale.
 */
export function parse(locale: string, input: string): number | null {
  return createParser({ locale }).parse(input).value;
}

/**
 * Round-trip verification: format a number, then parse it back.
 * Returns true if the parsed value equals the original.
 */
export function roundTrip(
  locale: string,
  value: number,
  formatOptions?: Intl.NumberFormatOptions
): boolean {
  const formatter = createFormatter({ locale, formatOptions });
  const parser = createParser({ locale, formatOptions });
  const formatted = formatter.format(value);
  const parsed = parser.parse(formatted).value;
  // Allow floating-point epsilon for decimal values
  if (parsed === null) return false;
  return Math.abs(parsed - value) < 1e-10;
}

// ── Unicode digit helpers ─────────────────────────────────────────────────────

/**
 * Convert an ASCII digit string to a locale's native digit system.
 * Uses Intl.NumberFormat to produce the correct digit script.
 *
 * e.g. toLocaleDigits('fa-IR', '1234') → '۱۲۳۴'
 */
export function toLocaleDigits(locale: string, ascii: string): string {
  // Format each digit separately using NumberFormat
  return ascii.replace(/\d/g, (d) => {
    const formatted = new Intl.NumberFormat(locale, { useGrouping: false }).format(Number(d));
    // Extract just the integer part (single digit)
    const parts = new Intl.NumberFormat(locale, { useGrouping: false }).formatToParts(Number(d));
    for (const p of parts) {
      if (p.type === "integer") return p.value;
    }
    return formatted;
  });
}

/**
 * Check whether Intl on the current Node.js build supports a given locale with
 * non-Latin digits. If Node was built without full-icu, some locales fall back
 * to ASCII — this helper lets tests skip gracefully rather than fail.
 */
export function localeUsesNativeDigits(locale: string): boolean {
  const zero = new Intl.NumberFormat(locale, { useGrouping: false }).format(0);
  return zero !== "0";
}
