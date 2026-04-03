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
  /**
   * Allow values outside min/max to be typed and committed without clamping.
   * Useful when server-side validation handles clamping.
   * When true, aria-invalid is set when value is out of range.
   * default: false
   */
  allowOutOfRange?: boolean;
  /**
   * Custom validation function. Called on every value change.
   * - Return `true` or `null`/`undefined` → valid
   * - Return `false` → invalid (aria-invalid set, no error message)
   * - Return a `string` → invalid with that string as the error message
   */
  validate?: (value: number | null) => boolean | string | null | undefined;
  /**
   * Fires with the raw unformatted string the user typed, preserving full
   * decimal precision before JS float conversion. Useful for financial apps
   * that need arbitrary-precision string arithmetic.
   * Fires alongside `onChange`.
   */
  onRawChange?: (rawValue: string | null) => void;
  /**
   * Custom format function. When provided, replaces the built-in Intl.NumberFormat
   * formatter for display purposes. Also used for initial display value.
   */
  formatValue?: (value: number) => string;
  /**
   * Custom parse function. When provided, replaces the built-in locale-aware parser.
   * Must return `{ value: number | null, isIntermediate: boolean }`.
   */
  parseValue?: (input: string) => { value: number | null; isIntermediate: boolean };
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface NumberFieldState {
  /** The display string shown in the input */
  inputValue: string;
  /** The parsed numeric value (null for empty/invalid) */
  numberValue: number | null;
  /**
   * The raw string value exactly as the user typed it (before formatting).
   * Preserves full decimal precision — useful for financial arbitrary-precision math.
   */
  rawValue: string | null;
  /** Whether increment is currently possible */
  canIncrement: boolean;
  /** Whether decrement is currently possible */
  canDecrement: boolean;
  /** Whether the ScrubArea is currently being dragged */
  isScrubbing: boolean;
  /** Update the isScrubbing state (called by useScrubArea) */
  setIsScrubbing: (val: boolean) => void;
  /** Whether the input is currently focused */
  isFocused: boolean;
  /** Update the isFocused state (called by useNumberField) */
  setIsFocused: (val: boolean) => void;
  /** Current validation state — 'valid' if no validate prop, or based on validate result */
  validationState: "valid" | "invalid";
  /** Error message from validate() if it returned a string, otherwise null */
  validationError: string | null;
  /** Internal: set the reason for the next onChange call (used by useNumberField) */
  _setLastChangeReason: (reason: ChangeReason) => void;
  /** Internal: read the current change reason (used by NumberField.Root) */
  _getLastChangeReason: () => ChangeReason;
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

/** Reason for a value change — propagated through onValueChange details */
export type ChangeReason =
  | "input"
  | "clear"
  | "blur"
  | "paste"
  | "keyboard"
  | "increment"
  | "decrement"
  | "wheel"
  | "scrub";

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
  /**
   * Controls what is placed in the clipboard on copy/cut.
   * - 'formatted' (default): browser-native copy of display string
   * - 'raw': numberValue as a plain JS number string (e.g. "1234.56")
   * - 'number': alias for 'raw'
   */
  copyBehavior?: "formatted" | "raw" | "number";
  /** Milliseconds before press-and-hold repeat starts (default: 400) */
  stepHoldDelay?: number;
  /** Initial milliseconds between repeats during press-and-hold (default: 200) */
  stepHoldInterval?: number;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  // Note: formatValue and parseValue are inherited from UseNumberFieldStateOptions
}

export interface NumberFieldAria {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  groupProps: React.HTMLAttributes<HTMLDivElement>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  hiddenInputProps: React.InputHTMLAttributes<HTMLInputElement> | null;
  incrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  decrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  descriptionProps: React.HTMLAttributes<HTMLElement>;
  errorMessageProps: React.HTMLAttributes<HTMLElement>;
}

// ── ScrubArea ─────────────────────────────────────────────────────────────────

export interface ScrubAreaOptions {
  /**
   * Axis to scrub on.
   * - 'horizontal' (default): dragging right increments, left decrements
   * - 'vertical': dragging up increments, down decrements
   * - 'both': uses whichever axis has greater movement
   */
  direction?: "horizontal" | "vertical" | "both";
  /** Pixels of drag movement required for one step (default: 4) */
  pixelSensitivity?: number;
}

// ── Component API ─────────────────────────────────────────────────────────────

export type StateRenderFn = (
  props: Record<string, unknown>,
  state: NumberFieldState
) => React.ReactElement;

export type RenderProp = React.ReactElement | StateRenderFn;

export interface ScrubAreaProps
  extends ScrubAreaOptions,
    Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  render?: RenderProp;
  children?: React.ReactNode;
}

export interface ScrubAreaCursorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  render?: RenderProp;
  children?: React.ReactNode;
}

export interface NumberFieldRootProps extends UseNumberFieldProps {
  children?: React.ReactNode;
  /** CSS class for the root wrapper div */
  className?: string;
  /** Inline style for the root wrapper div */
  style?: React.CSSProperties;
  /** Fires on every meaningful value change */
  onValueChange?: (
    value: number | null,
    details: {
      reason: ChangeReason;
      formattedValue: string;
      event?: React.SyntheticEvent;
    }
  ) => void;
  /** Fires only on commit (blur, Enter) */
  onValueCommitted?: (value: number | null, details: { reason: "blur" | "keyboard" }) => void;
}
