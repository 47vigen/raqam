"use client";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useNumberFieldState } from "./react/useNumberFieldState.js";
export { useNumberField } from "./react/useNumberField.js";
export { useControllableState } from "./react/useControllableState.js";

// ── Components ────────────────────────────────────────────────────────────────
export { NumberField } from "./react/NumberField.js";

// ── Context ───────────────────────────────────────────────────────────────────
export {
  NumberFieldContext,
  useNumberFieldContext,
} from "./react/context.js";
export type { NumberFieldContextValue } from "./react/context.js";

// ── Core (tree-shakeable) ─────────────────────────────────────────────────────
export { createFormatter } from "./core/formatter.js";
export { createParser } from "./core/parser.js";
export {
  normalizeDigits,
  isNonLatinDigit,
  registerLocale,
} from "./core/normalizer.js";
export { getCaretBoundary, computeNewCursorPosition } from "./core/cursor.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  LocaleInfo,
  FormatResult,
  ParseResult,
  CaretBoundary,
  DigitBlock,
  UseNumberFieldStateOptions,
  NumberFieldState,
  UseNumberFieldProps,
  NumberFieldAria,
  NumberFieldRootProps,
  RenderProp,
  StateRenderFn,
} from "./core/types.js";
export type { FormatterOptions, Formatter } from "./core/formatter.js";
export type { ParserOptions, Parser } from "./core/parser.js";
export type { LocaleConfig } from "./core/normalizer.js";
