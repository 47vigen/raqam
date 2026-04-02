/**
 * Format presets — named Intl.NumberFormatOptions configurations for common
 * number input patterns. Use these as the `formatOptions` prop value.
 *
 * @example
 * import { presets } from 'numra'
 * <NumberField.Root formatOptions={presets.currency('USD')} />
 * <NumberField.Root formatOptions={presets.percent} />
 * <NumberField.Root formatOptions={presets.compact} />
 */

export const presets = {
  /** Currency with standard sign display. Shorthand for `{ style:'currency', currency:code }`. */
  currency: (code: string): Intl.NumberFormatOptions => ({
    style: "currency",
    currency: code,
  }),

  /**
   * Accounting currency — negatives shown as `(1,234.56)` instead of `-$1,234.56`.
   * Requires the accounting format parser fix (built-in to numra).
   */
  accounting: (code: string): Intl.NumberFormatOptions => ({
    style: "currency",
    currency: code,
    currencySign: "accounting",
  }),

  /** Percentage — formats 0.42 as "42%" */
  percent: { style: "percent" } as Intl.NumberFormatOptions,

  /** Compact short — "1.2K", "3.4M" */
  compact: { notation: "compact" } as Intl.NumberFormatOptions,

  /** Compact long — "1.2 thousand", "3.4 million" */
  compactLong: {
    notation: "compact",
    compactDisplay: "long",
  } as Intl.NumberFormatOptions,

  /** Scientific notation — "1.234E3" */
  scientific: { notation: "scientific" } as Intl.NumberFormatOptions,

  /** Engineering notation — exponents always multiples of 3 */
  engineering: { notation: "engineering" } as Intl.NumberFormatOptions,

  /** Integer — no decimal places */
  integer: { maximumFractionDigits: 0 } as Intl.NumberFormatOptions,

  /**
   * Financial — always exactly 2 decimal places (fixed scale).
   * Combine with `fixedDecimalScale` prop for strict display.
   */
  financial: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  } as Intl.NumberFormatOptions,

  /**
   * Unit — shorthand for `{ style:'unit', unit:unitCode }`.
   * @example presets.unit('kilometer-per-hour') → { style:'unit', unit:'kilometer-per-hour' }
   */
  unit: (unit: string): Intl.NumberFormatOptions => ({
    style: "unit",
    unit,
  }),
} as const;
