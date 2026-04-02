import type { DigitBlock } from "./types.js";

// ── Built-in digit blocks ────────────────────────────────────────────────────
// These cover the digit systems required by the spec.
// Additional blocks can be registered via registerLocale().

const BUILTIN_DIGIT_BLOCKS: DigitBlock[] = [
  [0x0660, 0x0669], // Arabic-Indic (arab)
  [0x06f0, 0x06f9], // Extended Arabic-Indic / Persian (arabext)
  [0x0966, 0x096f], // Devanagari / Hindi (deva)
  [0x09e6, 0x09ef], // Bengali (beng)
  [0x0e50, 0x0e59], // Thai (thai)
];

// Mutable registry — locale plugins can add blocks here
const registeredBlocks: DigitBlock[] = [...BUILTIN_DIGIT_BLOCKS];

// ── Public API ────────────────────────────────────────────────────────────────

export interface LocaleConfig {
  /** Extra digit block ranges to register */
  digitBlocks?: DigitBlock[];
}

/**
 * Register additional digit blocks (called by locale plugins as a side effect).
 * Duplicate ranges are silently ignored.
 */
export function registerLocale(config: LocaleConfig): void {
  if (!config.digitBlocks) return;
  for (const block of config.digitBlocks) {
    const already = registeredBlocks.some(
      ([s]) => s === block[0]
    );
    if (!already) registeredBlocks.push(block);
  }
}

/**
 * Normalise any Unicode decimal digit in `input` to its ASCII equivalent (0–9).
 * Non-digit characters pass through unchanged.
 */
export function normalizeDigits(input: string): string {
  // Fast path: if there are no non-ASCII chars, return as-is
  if (!/[^\u0020-\u007e]/.test(input)) return input;

  return input.replace(/\p{Nd}/gu, (ch) => {
    const code = ch.codePointAt(0)!;
    for (const [start, end] of registeredBlocks) {
      if (code >= start && code <= end) {
        return String(code - start);
      }
    }
    // Fallback: let JS try to parse it as a decimal digit
    const digit = parseInt(ch, 10);
    return isNaN(digit) ? ch : String(digit);
  });
}

/**
 * Returns true if the character is a non-Latin Unicode decimal digit
 * (i.e. would need normalization).
 */
export function isNonLatinDigit(ch: string): boolean {
  const code = ch.codePointAt(0);
  if (code === undefined) return false;
  if (code >= 0x30 && code <= 0x39) return false; // ASCII 0-9
  for (const [start, end] of registeredBlocks) {
    if (code >= start && code <= end) return true;
  }
  return false;
}
