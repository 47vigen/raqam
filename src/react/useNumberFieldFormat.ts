"use client";

import { useMemo } from "react";
import { createFormatter } from "../core/formatter.js";
import type { UseNumberFieldStateOptions } from "../core/types.js";

type FormatOptions = Pick<
  UseNumberFieldStateOptions,
  | "locale"
  | "formatOptions"
  | "prefix"
  | "suffix"
  | "minimumFractionDigits"
  | "maximumFractionDigits"
  | "fixedDecimalScale"
>;

/**
 * Lightweight display-only formatting hook. Returns the formatted string for
 * a numeric value using the same Intl.NumberFormat engine as the full input.
 *
 * Use this when you need to display a formatted number in a read-only context
 * (table cells, summaries, labels) without the overhead of a full input state machine.
 *
 * @example
 * const price = useNumberFieldFormat(1234567.89, {
 *   locale: 'en-US',
 *   formatOptions: { style: 'currency', currency: 'USD' },
 * })
 * // price === "$1,234,567.89"
 *
 * @example
 * const pct = useNumberFieldFormat(0.4267, {
 *   formatOptions: { style: 'percent', maximumFractionDigits: 1 },
 * })
 * // pct === "42.7%"
 */
export function useNumberFieldFormat(value: number | null, options: FormatOptions = {}): string {
  const {
    locale,
    formatOptions,
    prefix,
    suffix,
    minimumFractionDigits,
    maximumFractionDigits,
    fixedDecimalScale,
  } = options;

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
      JSON.stringify(formatOptions),
      prefix,
      suffix,
      minimumFractionDigits,
      maximumFractionDigits,
      fixedDecimalScale,
    ]
  );

  return useMemo(() => {
    if (value === null || value === undefined) return "";
    return formatter.format(value);
  }, [value, formatter]);
}
