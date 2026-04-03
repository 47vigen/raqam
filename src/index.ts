// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useNumberFieldState } from "./react/useNumberFieldState.js";
export { useNumberField } from "./react/useNumberField.js";
export { useNumberFieldFormat } from "./react/useNumberFieldFormat.js";
export { useControllableState } from "./react/useControllableState.js";
export { usePressAndHold } from "./react/usePressAndHold.js";
export { useScrubArea } from "./react/useScrubArea.js";

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
  registerLocale,
} from "./core/normalizer.js";
export { getCaretBoundary, computeNewCursorPosition } from "./core/cursor.js";
export { presets } from "./core/presets.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  LocaleInfo,
  FormatResult,
  ParseResult,
  CaretBoundary,
  DigitBlock,
  ChangeReason,
  UseNumberFieldStateOptions,
  NumberFieldState,
  UseNumberFieldProps,
  NumberFieldAria,
  NumberFieldRootProps,
  ScrubAreaOptions,
  ScrubAreaProps,
  ScrubAreaCursorProps,
  RenderProp,
  StateRenderFn,
} from "./core/types.js";
export type { UsePressAndHoldOptions, PressAndHoldProps } from "./react/usePressAndHold.js";
export type { ScrubAreaReturn } from "./react/useScrubArea.js";
export type { FormatterOptions, Formatter } from "./core/formatter.js";
export type { ParserOptions, Parser } from "./core/parser.js";
export type { LocaleConfig } from "./core/normalizer.js";
