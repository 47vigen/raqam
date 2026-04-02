// ── Locale / formatting ──────────────────────────────────────────────────────

export interface LocaleInfo {
  /** Decimal separator for this locale (e.g. "." en-US, "," de-DE, "٫" fa-IR) */
  decimalSeparator: string;
  /** Grouping (thousands) separator (e.g. "," en-US, "." de-DE, "٬" fa-IR) */
  groupingSeparator: string;
  /** Minus sign character (usually "-" but can differ) */
  minusSign: string;
  /** Locale's representation of "0" (e.g. "0" for Latin, "۰" for Persian) */
  zero: string;
  /** Whether this is an RTL locale */
  isRTL: boolean;
}

export interface FormatResult {
  formatted: string;
  parts: Intl.NumberFormatPart[];
}

// ── Parsing ──────────────────────────────────────────────────────────────────

export interface ParseResult {
  /** The parsed number, or null if empty / un-parseable */
  value: number | null;
  /** True for valid numbers */
  isValid: boolean;
  /**
   * True for valid-but-incomplete input that must not be reformatted yet:
   * "-", "1.", "1.0", "1.00", etc.
   */
  isIntermediate: boolean;
}

// ── Cursor ───────────────────────────────────────────────────────────────────

/**
 * boolean[] of length formattedValue.length + 1.
 * true  → cursor may rest at this index
 * false → cursor must not rest here (e.g. inside a thousands separator)
 */
export type CaretBoundary = boolean[];

// ── Normalizer ───────────────────────────────────────────────────────────────

/** Unicode codepoint range [start, end] inclusive representing a digit block */
export type DigitBlock = readonly [number, number];

// ── State options ─────────────────────────────────────────────────────────────

export interface UseNumberFieldStateOptions {
  /** Controlled numeric value */
  value?: number | null;
  /** Uncontrolled default value */
  defaultValue?: number | null;
  /** Fires on every meaningful value change */
  onChange?: (value: number | null) => void;
  /** BCP 47 locale tag (default: browser locale) */
  locale?: string;
  /** Full Intl.NumberFormatOptions — currency, percent, decimal, etc. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Minimum allowed value */
  minValue?: number;
  /** Maximum allowed value */
  maxValue?: number;
  /** Step amount for increment/decrement (default: 1) */
  step?: number;
  /** Large step — Shift+Arrow / PageUp/Down (default: step * 10) */
  largeStep?: number;
  /** Small step — Meta/Ctrl+Arrow (default: step * 0.1) */
  smallStep?: number;
  /** Allow negative values (default: true) */
  allowNegative?: boolean;
  /** Allow decimal values (default: true) */
  allowDecimal?: boolean;
  /** Override maximumFractionDigits from formatOptions */
  maximumFractionDigits?: number;
  /** Override minimumFractionDigits from formatOptions */
  minimumFractionDigits?: number;
  /** Always show exactly maximumFractionDigits decimal places */
  fixedDecimalScale?: boolean;
  /** When clamping happens (default: "blur") */
  clampBehavior?: "blur" | "strict" | "none";
  /** Apply live formatting while typing (default: true) */
  liveFormat?: boolean;
  /** Arbitrary prefix string (e.g. "$") */
  prefix?: string;
  /** Arbitrary suffix string (e.g. " تومان") */
  suffix?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Make the field read-only */
  readOnly?: boolean;
  /** Mark the field as required */
  required?: boolean;
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface NumberFieldState {
  /** The display string shown in the input */
  inputValue: string;
  /** The parsed numeric value (null for empty/invalid) */
  numberValue: number | null;
  /** Whether increment is currently possible */
  canIncrement: boolean;
  /** Whether decrement is currently possible */
  canDecrement: boolean;
  /** Update display string (triggers parse + onChange) */
  setInputValue: (val: string) => void;
  /** Directly set the numeric value (triggers format + onChange) */
  setNumberValue: (val: number | null) => void;
  /** Format + clamp on blur — call from onBlur */
  commit: () => void;
  /** Increment by step */
  increment: (amount?: number) => void;
  /** Decrement by step */
  decrement: (amount?: number) => void;
  /** Jump to maxValue */
  incrementToMax: () => void;
  /** Jump to minValue */
  decrementToMin: () => void;
  /** Raw options (for hooks that need them) */
  options: UseNumberFieldStateOptions;
}

// ── Hook API ─────────────────────────────────────────────────────────────────

export interface UseNumberFieldProps extends UseNumberFieldStateOptions {
  /** Visible label text (used for aria-label fallback) */
  label?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  /** Form field name — renders a hidden input */
  name?: string;
  /** id for the input element */
  id?: string;
  /** Enable mouse-wheel increment/decrement */
  allowMouseWheel?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export interface NumberFieldAria {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  groupProps: React.HTMLAttributes<HTMLDivElement>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  hiddenInputProps: React.InputHTMLAttributes<HTMLInputElement> | null;
  incrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  decrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

// ── Component API ─────────────────────────────────────────────────────────────

export type StateRenderFn = (
  props: Record<string, unknown>,
  state: NumberFieldState
) => React.ReactElement;

export type RenderProp =
  | React.ReactElement
  | StateRenderFn;

export interface NumberFieldRootProps extends UseNumberFieldProps {
  children?: React.ReactNode;
  /** Fires on every meaningful value change */
  onValueChange?: (
    value: number | null,
    details: {
      reason:
        | "input"
        | "clear"
        | "blur"
        | "paste"
        | "keyboard"
        | "increment"
        | "decrement"
        | "wheel";
      formattedValue: string;
      event?: React.SyntheticEvent;
    }
  ) => void;
  /** Fires only on commit (blur, Enter) */
  onValueCommitted?: (
    value: number | null,
    details: { reason: "blur" | "keyboard" }
  ) => void;
}
