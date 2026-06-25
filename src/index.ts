// ── Hooks ─────────────────────────────────────────────────────────────────────

export { computeNewCursorPosition, getCaretBoundary } from "./core/cursor.js";
export type { Formatter, FormatterOptions } from "./core/formatter.js";
// ── Core (tree-shakeable) ─────────────────────────────────────────────────────
export { createFormatter } from "./core/formatter.js";
export type { LocaleConfig } from "./core/normalizer.js";
export {
  normalizeDigits,
  registerLocale,
} from "./core/normalizer.js";
export type { Parser, ParserOptions } from "./core/parser.js";
export { createParser } from "./core/parser.js";
export { presets } from "./core/presets.js";
// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  CaretBoundary,
  ChangeReason,
  DigitBlock,
  FormatResult,
  LocaleInfo,
  NumberFieldAria,
  NumberFieldRootProps,
  NumberFieldState,
  ParseResult,
  RenderProp,
  ScrubAreaCursorProps,
  ScrubAreaOptions,
  ScrubAreaProps,
  StateRenderFn,
  UseNumberFieldProps,
  UseNumberFieldStateOptions,
} from "./core/types.js";
export type { NumberFieldContextValue } from "./react/context.js";
// ── Context ───────────────────────────────────────────────────────────────────
export {
  NumberFieldContext,
  useNumberFieldContext,
} from "./react/context.js";
// ── Components ────────────────────────────────────────────────────────────────
export { NumberField } from "./react/NumberField.js";
export { useControllableState } from "./react/useControllableState.js";
export { useNumberField } from "./react/useNumberField.js";
export { useNumberFieldFormat } from "./react/useNumberFieldFormat.js";
export { useNumberFieldState } from "./react/useNumberFieldState.js";
export type { PressAndHoldProps, UsePressAndHoldOptions } from "./react/usePressAndHold.js";
export { usePressAndHold } from "./react/usePressAndHold.js";
export type { ScrubAreaReturn } from "./react/useScrubArea.js";
export { useScrubArea } from "./react/useScrubArea.js";
