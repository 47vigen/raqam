# raqam — reference digest

Self-contained quick lookup. For prose/examples and live demos see the official
docs and [SKILL.md](SKILL.md) canonical links. Confirm the current version on npm.

## Entry points

| Import | Provides |
|--------|----------|
| `raqam` | `NumberField`, `useNumberFieldState`, `useNumberField`, `useNumberFieldFormat`, `useControllableState`, `usePressAndHold`, `useScrubArea`, `NumberFieldContext`, `useNumberFieldContext`, plus all core re-exports + types |
| `raqam/react` | Same hooks/components (alternate React entry) |
| `raqam/core` | No React: `createFormatter`, `createParser`, `normalizeDigits`, `registerLocale`, `getCaretBoundary`, `computeNewCursorPosition`, `presets` + types |
| `raqam/server` | **Alias of `raqam/core`** — safe in RSC / Edge / Node (zero React deps) |
| `raqam/locales/<lang>` | Side-effect digit plugins: `fa`, `ar`, `bn`, `hi`, `th` |
| `raqam/locales` | Registers all plugins; re-exports `FA_LOCALE_CODES` … `TH_LOCALE_CODES` |

Peer deps: **React 18 or 19** (+ `react-dom`).

## `useNumberFieldState(options)` → `NumberFieldState`

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `value` | `number \| null` | — | Controlled value |
| `defaultValue` | `number \| null` | `null` | Uncontrolled initial value |
| `onChange` | `(v: number \| null) => void` | — | Fires when the parsed value changes |
| `onRawChange` | `(raw: string \| null) => void` | — | Unformatted, precision-preserving numeric string (grouping/currency/prefix/suffix stripped, locale decimal → `.`, trailing zeros kept; falls back to canonical numeric string for percent/compact/scientific/unit/custom `formatValue`) |
| `locale` | `string` | runtime | BCP 47 tag |
| `formatOptions` | `Intl.NumberFormatOptions` | `{}` | Full Intl options |
| `minValue` / `maxValue` | `number` | — | Range |
| `step` | `number` | `1` | ↑/↓ |
| `largeStep` | `number` | `step×10` | Shift+↑/↓, PageUp/Down |
| `smallStep` | `number` | `step×0.1` | Ctrl/Cmd+↑/↓ |
| `clampBehavior` | `"blur" \| "strict" \| "none"` | `"blur"` | When to clamp |
| `allowOutOfRange` | `boolean` | `false` | Keep+commit out-of-range, set `aria-invalid` |
| `allowNegative` | `boolean` | `true` | |
| `allowDecimal` | `boolean` | `true` | |
| `maximumFractionDigits` | `number` | — | Override format |
| `minimumFractionDigits` | `number` | — | Override format |
| `fixedDecimalScale` | `boolean` | `false` | Needs `maximumFractionDigits` to apply |
| `prefix` / `suffix` | `string` | — | e.g. `"$"`, `" تومان"` |
| `liveFormat` | `boolean` | `true` | Off ⇒ format on blur only |
| `validate` | `(v) => boolean \| string \| null \| undefined` | — | `string` ⇒ error message |
| `disabled` / `readOnly` / `required` | `boolean` | `false` | |
| `incrementLabel` / `decrementLabel` | `string` | `"Increase"` / `"Decrease"` | Stepper button aria-labels (i18n) |
| `formatValue` | `(v: number) => string` | — | Custom formatter |
| `parseValue` | `(s: string) => { value: number\|null; isIntermediate: boolean }` | — | Custom parser |

### `NumberFieldState`

`inputValue: string` · `numberValue: number \| null` · `rawValue: string \| null`
· `isFocused` / `isScrubbing: boolean` · `canIncrement` / `canDecrement: boolean`
· `validationState: "valid"\|"invalid"` · `validationError: string \| null`
· `increment(amount?)` · `decrement(amount?)` · `incrementToMax()` · `decrementToMin()`
· `setInputValue(s, knownValue?)` · `setNumberValue(n)` · **`commit(): number \| null`**
· `setIsFocused(b)` · `setIsScrubbing(b)` · `options`.

## `useNumberField(props, state, inputRef)` → `NumberFieldAria`

Accepts every `useNumberFieldState` option **plus**:

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | `string` | — | aria-label fallback |
| `id` | `string` | auto | input id (else `useId`) |
| `aria-label` / `aria-labelledby` / `aria-describedby` | `string` | — | Naming/description wiring |
| `name` | `string` | — | enables `hiddenInputProps` |
| `allowMouseWheel` | `boolean` | `false` | wheel nudges while focused (non-passive) |
| `copyBehavior` | `"formatted" \| "raw" \| "number"` | `"formatted"` | clipboard on copy/cut |
| `stepHoldDelay` | `number` | `400` | press-and-hold delay (ms) |
| `stepHoldInterval` | `number` | `200` | press-and-hold repeat (ms), accelerates to 50ms |
| `onFocus` / `onBlur` | `(e) => void` | — | |
| `onValueCommitted` | `(v, { reason: "blur"\|"keyboard" }) => void` | — | fires on blur/Enter, post-clamp |

**Gotcha:** pass the same formatting options to both hooks (the behavior hook
builds its own formatter/parser).

### `NumberFieldAria` keys → element

`labelProps` (→ `<label>`, includes a registration `ref` — keep it) · `groupProps`
(→ `<div role="group">`) · `inputProps` (→ `<input role="spinbutton">`) ·
`incrementButtonProps` / `decrementButtonProps` (→ `<button>`, `aria-label`
`"Increase"`/`"Decrease"`, `tabIndex={-1}`) · `hiddenInputProps` (→ hidden input or
`null`) · `descriptionProps` · `errorMessageProps` (`role="alert"`).

## `NumberField.*` components

`Root` · `Label` · `Group` · `Input` · `Increment` · `Decrement` · `HiddenInput`
· `ScrubArea` (Pointer Lock; `role="slider"`, arrow-key accessible; props
`direction` `"horizontal"|"vertical"|"both"`, `pixelSensitivity` default 4 (values
<1 clamped), `label` default `"Scrub to change value"`) ·
`ScrubAreaCursor` (renders only while scrubbing) · `Description` (auto-linked via
the input's `aria-describedby` while mounted) · `ErrorMessage` (auto-renders
`validationError`) · `Formatted` (`aria-hidden` read-only display).

`Label`/`Group`/`Input`/`Increment`/`Decrement`/`ScrubArea`/`ScrubAreaCursor`/
`Formatted` accept a **`render`** prop (element or `(props, state) => element`).

### `NumberField.Root` extras (beyond state/behavior options)

- `onValueChange(value, { reason, formattedValue, event? })` — every change.
- `onValueCommitted(value, { reason: "blur" \| "keyboard" })` — settled value only.
- `className` / `style` — applied to the root wrapper `<div>`.

## Change reasons (`ChangeReason`)

`"input"` · `"clear"` (edit empties field) · `"blur"` · `"paste"` · `"keyboard"`
(arrows / PageUp-Down / Home-End) · `"increment"` · `"decrement"` · `"wheel"` · `"scrub"`.

## Keyboard

↑/↓ step · Shift+↑/↓ largeStep · Ctrl/Cmd+↑/↓ smallStep · PageUp/Down largeStep ·
Home/End → min/max (only when set) · Enter commit (fires `onValueCommitted`) ·
Backspace deletes through grouping separators and trailing affordances; typing the
decimal separator when one exists jumps the caret after it.

## `presets` (formatOptions builders)

`currency(code)` · `accounting(code)` (negatives in parens) · `percent` (stores
fraction) · `compact` · `compactLong` · `scientific` · `engineering` · `integer`
· `financial` (min/max fraction 2) · `unit(unitCode)`. `compact`/`scientific`/
`engineering` format **on blur**, not live.

## Locale plugins

| Import | Digits |
|--------|--------|
| `raqam/locales/fa` | Persian ۰–۹ (+ Arabic-Indic) |
| `raqam/locales/ar` | Arabic-Indic ٠–٩ |
| `raqam/locales/bn` | Bengali ০–৯ |
| `raqam/locales/hi` | Devanagari ०–९ (covers mr, ne) |
| `raqam/locales/th` | Thai ๐–๙ |

Custom digits: `registerLocale({ digitBlocks: [[start, end]] })`.

## Core / server API

`createFormatter(opts)` → `{ format, formatToParts, formatResult, getLocaleInfo }`
· `createParser(opts)` → `{ parse, isIntermediate, getLocaleInfo, strip }` (`strip(input)` ⇒ bare numeric string, affordances removed, trailing zeros kept)
· `normalizeDigits(s)` · `registerLocale(cfg)` · `getCaretBoundary(formatted, info)`
· `computeNewCursorPosition(old, oldCaret, newFormatted, info, inputType?)` · `presets`.

Result types: `LocaleInfo { decimalSeparator, groupingSeparator, minusSign, zero, isRTL }`
· `ParseResult { value, isValid, isIntermediate }` · `FormatResult { formatted, parts }`.

## Advanced primitives

`useControllableState` · `usePressAndHold(cb, { delay, interval, disabled })` ·
`useScrubArea(state, { direction, pixelSensitivity, label })` → `{ isScrubbing, scrubAreaProps, virtualCursor }`
· `NumberFieldContext` / `useNumberFieldContext()` → `{ state, aria, inputRef, props }`.

## Data attributes (CSS)

- **Root:** `data-focused`, `data-invalid`, `data-disabled`, `data-readonly`, `data-required`, `data-scrubbing`.
- **Input:** `data-rtl`, plus `data-invalid` / `data-disabled` / `data-readonly` / `data-required`.

## Exported types

`UseNumberFieldStateOptions`, `NumberFieldState`, `UseNumberFieldProps`,
`NumberFieldAria`, `NumberFieldRootProps`, `ChangeReason`, `LocaleInfo`,
`FormatResult`, `ParseResult`, `CaretBoundary`, `DigitBlock`, `ScrubAreaOptions`,
`ScrubAreaProps`, `ScrubAreaCursorProps`, `RenderProp`, `StateRenderFn`,
`NumberFieldContextValue`, `FormatterOptions`, `Formatter`, `ParserOptions`,
`Parser`, `LocaleConfig`, `UsePressAndHoldOptions`, `PressAndHoldProps`,
`ScrubAreaReturn`.
