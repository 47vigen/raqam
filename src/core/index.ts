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
  RenderProp,
  StateRenderFn,
} from "./types.js";

export { presets } from "./presets.js";

export { normalizeDigits, isNonLatinDigit, registerLocale } from "./normalizer.js";
export type { LocaleConfig } from "./normalizer.js";

export { createFormatter } from "./formatter.js";
export type { FormatterOptions, Formatter } from "./formatter.js";

export { createParser } from "./parser.js";
export type { ParserOptions, Parser } from "./parser.js";

export { getCaretBoundary, computeNewCursorPosition } from "./cursor.js";
