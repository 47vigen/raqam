# The definitive React number input: design specification

> **📜 Historical design document.** This is the original specification written
> **before** raqam was implemented. It captures the research, gap analysis, and
> architecture decisions (ADRs) that shaped the library — kept as design
> rationale for contributors. It is **not** API documentation and some details
> describe the *plan*, not what shipped (targets, names, type sketches, and the
> week-by-week roadmap have since changed).
>
> For the **shipped API and current usage**, see:
> - [`README.md`](README.md) — quick start + API tables
> - The docs site — <https://47vigen.github.io/raqam/>
> - [`CHANGELOG.md`](CHANGELOG.md) — what actually shipped per release
>
> The architecture rationale below (ADRs §4, the cursor engine §6, the i18n/RTL
> strategy §7) remains accurate and is the best place to understand *why* raqam
> is built the way it is.

**No existing React number input package combines live formatting, true headless composability, full i18n digit support, and gold-standard accessibility into one solution.** This document specifies exactly how to build one. After analyzing every major competitor — Base UI, React Aria, Mantine, Chakra, rc-input-number, and react-number-format — we identified a critical gap: libraries excel at one or two of these dimensions but fail at the rest. React Aria has the best accessibility and i18n parsing (30+ locales, Arabic/Persian digit input) but only formats on blur. Mantine wraps react-number-format for live formatting but is locked to its design system. Base UI is truly headless with an innovative ScrubArea but lacks live formatting and i18n digit parsing. **This package — `raqam` — unifies all four pillars into a single, tree-shakeable, zero-dependency library shipping both a Hook API and a Headless Component API.**

---

## 1. Executive summary

The package targets a **< 5 KB min+gzip** core with optional locale plugins, supports React 18 and 19, and provides two consumption patterns: a low-level hook (`useNumberField`) for maximum composability with any design system, and compound headless components (`NumberField.Root`, `NumberField.Input`, etc.) for rapid integration. The hardest technical challenge — **cursor position preservation during live formatting** — is solved by adapting the "accepted characters boundary" algorithm pioneered by react-number-format and RIFM, implemented via `useLayoutEffect` for flicker-free cursor restoration. The internal architecture separates a framework-agnostic core (formatting, parsing, cursor math) from React-specific state and behavior layers, enabling future framework ports.

---

## 2. What's broken in existing solutions

### The live formatting gap is universal among headless libraries

Of the six packages analyzed, **only Mantine and rc-input-number** support real-time thousand-separator formatting while typing. Base UI, Chakra, and React Aria all format exclusively on blur — the user types raw digits and sees formatted output only after leaving the field. This creates a poor UX for financial applications where users need visual confirmation that "1234567" is indeed "$1,234,567" before they submit.

The root cause is architectural: live formatting requires solving cursor position preservation, which is algorithmically complex. Libraries that avoid it gain simplicity but sacrifice UX. Mantine solves it by wrapping react-number-format (adding **~5.7 KB** of dependency), while rc-input-number implements an internal `useCursor` hook. Neither is headless.

### No package combines headless architecture with i18n digit parsing

React Aria is the only library with **native first-class support for Persian (۰-۹) and Arabic-Indic (٠-٩) digit input**, powered by `@internationalized/number`. It correctly parses typed Arabic-Extended digits, handles locale-specific decimal separators (٫ for fa-IR, ٬ for grouping), and supports 30+ locales with multiple numbering systems. However, React Aria's formatting only applies on blur, and its hook API, while excellent, ships with a substantial dependency chain (**~25-40 KB** with i18n libraries).

Base UI and Chakra rely on `Intl.NumberFormat` for display formatting but provide no input parsing for non-Latin digits. A Persian user typing ۱۲۳۴ on a standard ISIRI 9147 keyboard — which produces Extended Arabic-Indic digits by default — gets rejected or ignored.

### The composability spectrum has gaps at both ends

| Library                   | Headless         | Live Format      | i18n Input       | Accessibility | Bundle   |
| ------------------------- | ---------------- | ---------------- | ---------------- | ------------- | -------- |
| Base UI NumberField       | ✅ Fully         | ❌ Blur only     | ❌ Display only  | ✅ Good       | ~10 KB   |
| React Aria useNumberField | ✅ Fully         | ❌ Blur only     | ✅ Native        | ✅✅ Gold     | ~30 KB   |
| Mantine NumberInput       | ❌ Design system | ✅ Live          | ⚠️ Manual        | ⚠️ Basic      | ~60 KB+  |
| Chakra NumberInput        | ❌ Design system | ❌ Blur only     | ❌ No            | ✅ Good       | ~100 KB+ |
| rc-input-number           | ⚠️ Partial       | ✅ Via formatter | ❌ Manual        | ⚠️ Basic      | ~13 KB   |
| react-number-format       | N/A (formatter)  | ✅ Best          | ⚠️ customNumrals | ❌ None       | ~5.7 KB  |

**No single cell in this table is "✅" across all rows.** That's the opportunity.

### Additional notable packages confirm the gap

**react-number-format** (~5.7 KB, 3.3M weekly downloads) has the best cursor engine in the ecosystem — its `getCaretBoundary()` function returns a boolean array marking valid cursor positions, and its `ChangeMeta` tracking handles every edge case. But it's purely a formatter: no stepper buttons, no min/max clamping, no ARIA spinbutton role, no keyboard arrow increment.

**RIFM** (~800 bytes) offers an elegant cursor algorithm based on counting "accepted characters" before the cursor position, but provides no number-specific logic — it's a generic formatting wrapper.

**AutoNumeric** is feature-rich but vanilla JS, heavy, and not React-native.

---

## 3. Complete feature requirements

### Priority 1 — Core (MVP)

These features define the minimum viable package that differentiates from competitors:

- **Live formatting while typing**: Thousand separators appear in real-time, not on blur. Cursor position preserved correctly after every keystroke using the accepted-characters boundary algorithm.
- **Dual API**: Hook API (`useNumberField` + `useNumberFieldState`) and Headless Component API (`NumberField.Root`, `.Input`, `.Increment`, `.Decrement`, `.Group`, `.Label`).
- **Full `Intl.NumberFormat` integration**: `formatOptions` prop accepting all standard options (currency, percent, unit, decimal control, sign display, grouping modes).
- **Unicode digit normalization**: Accept input in Persian (U+06F0–U+06F9), Arabic-Indic (U+0660–U+0669), and all `Intl.NumberFormat` numbering systems. Always output JavaScript `number`.
- **Locale-aware parsing**: Automatically detect grouping separator, decimal separator, and minus sign from locale via `formatToParts()`. Parse `1.234,56` correctly in de-DE, `۱٬۲۳۴` in fa-IR.
- **Min/max/step constraints** with clamping behavior options (blur, strict, none).
- **Decimal control**: `minimumFractionDigits`, `maximumFractionDigits`, `fixedDecimalScale`.
- **Negative number support** with `allowNegative` prop.
- **Keyboard interactions**: Up/Down arrows (step), Shift+Arrow (largeStep, default 10×), Meta+Arrow (smallStep, default 0.1×), Page Up/Down (largeStep), Home/End (min/max).
- **ARIA spinbutton**: `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (formatted string), screen reader announcements.
- **Controlled/uncontrolled** via `useControllableState` pattern.
- **`type="text"` input** with `inputmode="decimal"` for mobile numeric keyboard.
- **Form integration**: `name` prop renders hidden input with raw numeric value for FormData.

### Priority 2 — Enhanced features

- **Prefix/suffix** support: Both `Intl.NumberFormat`-driven (currency symbols, units) and arbitrary string prefix/suffix (`prefix="$"`, `suffix=" تومان"`).
- **Mouse wheel** increment/decrement (opt-in via `allowMouseWheel`).
- **ScrubArea**: Drag-on-label to change value (Pointer Lock API), with configurable pixel sensitivity and direction.
- **Press-and-hold acceleration** for increment/decrement buttons with configurable `stepHoldDelay` and `stepHoldInterval`.
- **Paste handling**: Parse pasted values intelligently — strip currency symbols, detect locale, normalize digits, handle ambiguous formats.
- **Copy behavior**: Copy raw numeric value by default, with option to copy formatted value.
- **RTL support**: `direction: ltr; text-align: right` on input in RTL contexts, BiDi-safe currency rendering.
- **`allowOutOfRange`**: Option to allow typing values outside min/max (for UX where clamping happens server-side).

### Priority 3 — Advanced features

- **String mode** for arbitrary-precision decimals (avoid IEEE 754 floating-point issues for financial math).
- **Scientific notation** display (`notation: 'scientific'` or `'engineering'`).
- **Compact notation** (`notation: 'compact'` — "1.2K", "3.4M").
- **Accounting format** for negative numbers (parentheses instead of minus).
- **Custom formatter/parser** escape hatch for consumers who need non-`Intl.NumberFormat` formatting.
- **`validate` callback** for custom validation logic.
- **IME composition** handling (for CJK environments where number input may go through IME).
- **Server Component** compatibility: components marked with `"use client"` directive; pure utilities usable in server context.

---

## 4. Technical architecture decisions

### ADR-001: Input type is always `text`, never `number`

**Decision**: Use `<input type="text" inputmode="decimal">`.

**Context**: HTML `<input type="number">` cannot display thousand separators, rejects non-Latin digits, has inconsistent browser behavior for decimals across locales, and fires `onChange` with empty string for invalid input. The `type="text"` approach with `inputmode="decimal"` triggers the correct mobile keyboard while allowing complete control over formatting and parsing.

### ADR-002: Live formatting via onChange + useLayoutEffect cursor restoration

**Decision**: Format the value inside the `onChange` handler, compute the new cursor position using the accepted-characters boundary algorithm, store it in a ref, then restore it in `useLayoutEffect`.

**Context**: Three approaches were evaluated:

1. **Format on blur only** (React Aria, Base UI approach): Simplest, avoids cursor issues entirely, but fails the live-formatting requirement.
2. **Format in onChange, restore cursor in useLayoutEffect** (react-number-format pattern): Formats every keystroke, computes correct cursor position, restores it synchronously before browser paint. No flicker.
3. **Format via beforeinput event interception**: Would allow preventing invalid input before DOM changes, but React's synthetic event system doesn't fully expose `InputEvent.inputType`, requiring native `addEventListener` workarounds.

Option 2 is chosen. The `useLayoutEffect` fires after React commits the formatted value to the DOM but before the browser paints, eliminating cursor flicker. React 18/19 automatic batching ensures state updates are atomic.

### ADR-003: Accepted-characters boundary algorithm for cursor positioning

**Decision**: Implement a `getCaretBoundary(formattedValue: string) → boolean[]` function that returns valid cursor positions, combined with digit-counting to map the pre-format cursor to the post-format position.

**Algorithm**:

1. After the user types, capture `selectionStart` from the native event.
2. Count the number of "accepted characters" (digits, decimal separator, minus sign) before the cursor in the raw input.
3. Apply formatting to produce the new display string.
4. In the formatted string, find the position where the same count of accepted characters precedes the cursor.
5. Generate a boundary array marking positions adjacent to formatting-only characters (grouping separators, currency symbols) as invalid.
6. Snap to the nearest valid position.

This is the same approach used by react-number-format's caret engine and RIFM's cursor algorithm. It handles insertion, deletion, paste, and selection replacement correctly.

### ADR-004: Dual internal state — display string and numeric value

**Decision**: The state layer maintains two synchronized values: `inputValue` (string, what the user sees) and `numberValue` (number | null, the semantic value).

**Rationale**: During typing, intermediate states like `-`, `1.`, `1.0` are valid input-in-progress but not valid JavaScript numbers. Storing the display as a string preserves these states. The numeric value is computed by parsing the display string, with `null` for empty/unparseable states. On blur, `inputValue` is re-formatted from `numberValue` to clean up intermediate states.

### ADR-005: Locale handling via Intl.NumberFormat with plugin architecture

**Decision**: Core formatting/parsing uses `Intl.NumberFormat` and `formatToParts()`. Digit normalization for non-Latin scripts is provided via tree-shakeable locale modules.

**Architecture**:

```
raqam
├── core (formatting, parsing, cursor math) — 0 deps, ~2 KB
├── react (hooks + components) — peer dep: react — ~3 KB
├── locales/fa (Persian digit normalization + separators)
├── locales/ar (Arabic-Indic digit normalization)
├── locales/bn (Bengali digits)
└── locales/hi (Hindi/Devanagari + lakh grouping)
```

The core always handles Latin digits and `Intl.NumberFormat` output. Locale plugins add input normalization for non-Latin digits. Importing `raqam/locales/fa` registers Persian digit ranges — if not imported, the code is tree-shaken away.

### ADR-006: Single package with subpath exports

**Decision**: Ship as one npm package with subpath exports, not a monorepo of separate packages.

**Rationale**: The codebase is tightly coupled (formatting logic feeds into hooks which feed into components). Separate packages would create version synchronization headaches. Subpath exports provide the same tree-shaking benefits: `import { useNumberField } from 'raqam'` for the hook, `import { NumberField } from 'raqam'` (or `raqam/react`) for headless components, `import 'raqam/locales/fa'` for Persian support. (As shipped, the entry points are `raqam`, `raqam/core`, `raqam/react`, `raqam/server`, and `raqam/locales/*` — there is no `raqam/components` subpath.)

### ADR-007: render prop pattern for element replacement

**Decision**: Use the `render` prop pattern (Base UI style) rather than `asChild` (Radix style) for element replacement in headless components.

**Rationale**: The `render` prop offers explicit prop spreading (`{...props}` in the render function), better TypeScript inference, and easier debugging compared to the implicit prop merging of `asChild` via `Slot`. It also supports both element form (`render={<MyButton />}`) and function form (`render={(props, state) => <MyButton {...props} />}`).

---

## 5. Package structure and API design

### Directory layout

```
raqam/
├── src/
│   ├── core/
│   │   ├── formatter.ts        # Intl.NumberFormat wrapper, formatToParts
│   │   ├── parser.ts           # Locale-aware number parsing
│   │   ├── cursor.ts           # getCaretBoundary, cursor position math
│   │   ├── normalizer.ts       # Unicode digit normalization
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   └── index.ts
│   ├── react/
│   │   ├── useNumberFieldState.ts  # Pure state management hook
│   │   ├── useNumberField.ts       # Behavior hook (ARIA, keyboard, events)
│   │   ├── useControllableState.ts # Controlled/uncontrolled pattern
│   │   ├── NumberField.tsx         # Compound headless components
│   │   ├── context.ts              # React context for compound components
│   │   └── index.ts
│   ├── locales/
│   │   ├── fa.ts    # Persian: U+06F0–U+06F9, ٫ decimal, ٬ grouping
│   │   ├── ar.ts    # Arabic: U+0660–U+0669
│   │   ├── bn.ts    # Bengali: U+09E6–U+09EF
│   │   ├── hi.ts    # Devanagari: U+0966–U+096F
│   │   ├── th.ts    # Thai: U+0E50–U+0E59
│   │   └── index.ts # All locales (for consumers who want everything)
│   └── index.ts     # Main barrel export
├── tsup.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── .changeset/
```

### Hook API design

```typescript
// --- State Hook ---
interface UseNumberFieldStateOptions {
  value?: number | null
  defaultValue?: number
  onChange?: (value: number | null) => void
  locale?: string // BCP 47 locale tag
  formatOptions?: Intl.NumberFormatOptions // Full Intl options
  minValue?: number
  maxValue?: number
  step?: number
  largeStep?: number // Default: 10
  smallStep?: number // Default: 0.1
  allowNegative?: boolean // Default: true
  allowDecimal?: boolean // Default: true
  maximumFractionDigits?: number
  fixedDecimalScale?: boolean
  clampBehavior?: "blur" | "strict" | "none"
  liveFormat?: boolean // Default: true (THE differentiator)
  prefix?: string
  suffix?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
}

interface NumberFieldState {
  inputValue: string // Display string (formatted)
  numberValue: number | null // Parsed numeric value
  canIncrement: boolean
  canDecrement: boolean
  setInputValue(val: string): void
  setNumberValue(val: number | null): void
  commit(): void // Format + clamp on blur
  increment(): void
  decrement(): void
  incrementToMax(): void
  decrementToMin(): void
}

function useNumberFieldState(
  options: UseNumberFieldStateOptions
): NumberFieldState

// --- Behavior Hook ---
interface UseNumberFieldProps extends UseNumberFieldStateOptions {
  label?: string
  "aria-label"?: string
  "aria-describedby"?: string
  name?: string
  id?: string
  allowMouseWheel?: boolean
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
}

interface NumberFieldAria {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  groupProps: React.HTMLAttributes<HTMLDivElement>
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  hiddenInputProps: React.InputHTMLAttributes<HTMLInputElement>
  incrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>
  decrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>
  descriptionProps: React.HTMLAttributes<HTMLElement>
  errorMessageProps: React.HTMLAttributes<HTMLElement>
}

function useNumberField(
  props: UseNumberFieldProps,
  state: NumberFieldState,
  inputRef: React.RefObject<HTMLInputElement>
): NumberFieldAria
```

### Headless Component API design

```tsx
// Usage example
<NumberField.Root
  defaultValue={1234.56}
  locale="en-US"
  formatOptions={{ style: 'currency', currency: 'USD' }}
  onValueChange={(value, { reason }) => console.log(value, reason)}
  liveFormat
>
  <NumberField.Label>Price</NumberField.Label>
  <NumberField.Group>
    <NumberField.Decrement>−</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>

// With ScrubArea
<NumberField.Root defaultValue={50} minValue={0} maxValue={100}>
  <NumberField.ScrubArea direction="horizontal" pixelSensitivity={2}>
    <NumberField.Label>Opacity</NumberField.Label>
    <NumberField.ScrubAreaCursor>
      <ScrubIcon />
    </NumberField.ScrubAreaCursor>
  </NumberField.ScrubArea>
  <NumberField.Group>
    <NumberField.Input />
    <NumberField.Decrement render={<IconButton />}>▼</NumberField.Decrement>
    <NumberField.Increment render={<IconButton />}>▲</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

**Each sub-component** accepts `render`, `className` (string or state function), `style` (object or state function), and standard HTML props. Data attributes (`data-disabled`, `data-invalid`, `data-focused`, `data-scrubbing`) enable CSS-only styling.

### Event callback design

```typescript
interface NumberFieldRootProps {
  // Fires on every meaningful value change
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
        | "wheel"
        | "scrub"
      formattedValue: string
      event?: React.SyntheticEvent
    }
  ) => void

  // Fires only on commit (blur, Enter, button release)
  onValueCommitted?: (
    value: number | null,
    details: { reason: "blur" | "pointer-up" | "keyboard" }
  ) => void
}
```

Using `onValueChange` (not `onChange`) avoids confusion with the native DOM event and aligns with Radix/Base UI conventions.

---

## 6. The cursor preservation engine

This is the hardest implementation challenge. The algorithm works in three stages:

**Stage 1 — Capture.** In the `onChange` handler, read `event.target.selectionStart` before React processes the update. Also read the `inputType` from `event.nativeEvent` to determine what the user did (insert, delete, paste).

**Stage 2 — Compute.** Strip formatting from both the old display value and the new raw input. Count accepted characters (digits + decimal + minus) before the cursor in the raw input. Apply the formatter to produce the new display string. Generate a `caretBoundary` array — a `boolean[]` of length `formattedValue.length + 1` where `true` means the cursor can rest at that position and `false` means it cannot (e.g., immediately after a grouping separator, inside a prefix). Walk the boundary array to find the position where the same count of accepted characters precedes it, snapping to the nearest `true` boundary.

**Stage 3 — Restore.** Store the computed cursor position in a `React.useRef`. In `useLayoutEffect` (keyed on the display value), call `inputRef.current.setSelectionRange(pos, pos)` only if the input is the active element. Because `useLayoutEffect` fires synchronously after DOM mutation but before paint, the user never sees the cursor jump.

**Edge cases handled**:

- **Deletion of a grouping separator**: User presses Backspace on the comma in `1,|234` → detected via `inputType === 'deleteContentBackward'`, so the preceding digit is deleted instead, producing `|234`.
- **Paste**: The entire pasted string is normalized (strip non-numerics, normalize digits, detect locale), then formatted, with cursor placed at the end of the pasted content.
- **Selection replacement**: When the user selects "234" in "1,234" and types "5", the accepted-character count correctly accounts for the replaced characters.
- **Trailing decimal**: `1.` is preserved as-is during typing (not formatted to `1`) since it represents valid input-in-progress.
- **Lone minus sign**: `-` is preserved as a valid intermediate state.

---

## 7. Persian, Arabic, and RTL number handling

### Digit normalization architecture

The normalizer uses a lookup table mapping Unicode digit ranges to their ASCII equivalents:

```typescript
const DIGIT_BLOCKS: [number, number][] = [
  [0x0660, 0x0669], // Arabic-Indic (arab)
  [0x06f0, 0x06f9], // Extended Arabic-Indic / Persian (arabext)
  [0x0966, 0x096f], // Devanagari (deva)
  [0x09e6, 0x09ef], // Bengali (beng)
  [0x0e50, 0x0e59] // Thai (thai)
  // ... additional blocks loaded via locale plugins
]

function normalizeToASCII(input: string): string {
  return input.replace(/\p{Nd}/gu, (ch) => {
    const code = ch.codePointAt(0)!
    for (const [start] of DIGIT_BLOCKS) {
      if (code >= start && code <= start + 9) return String(code - start)
    }
    return ch
  })
}
```

Each locale plugin registers its digit block and its locale-specific separator characters. For fa-IR: decimal separator is ٫ (U+066B), grouping separator is ٬ (U+066C). For de-DE: decimal is `,`, grouping is `.`. The parser extracts these dynamically via `Intl.NumberFormat(locale).formatToParts(12345.6)`.

### RTL rendering strategy

**Numbers are always LTR**, even in RTL documents. The component applies `direction: ltr` and `text-align: right` on the input element when an RTL locale is detected. This ensures digits flow left-to-right (matching mathematical convention) while visually aligning with the RTL page layout. A `unicode-bidi: embed` declaration isolates the LTR number from surrounding RTL text.

For currency symbols in RTL locales (like ﷼ appearing after the number in fa-IR), `formatToParts()` provides the exact position of each part. The component renders the currency symbol in the correct position relative to the number, wrapped in appropriate directional markers when needed.

### Keyboard input on Persian/Arabic layouts

The ISIRI 9147 Persian keyboard standard produces **Extended Arabic-Indic digits (U+06F0–U+06F9)** when number keys are pressed. This means a Persian user's natural keyboard input generates non-ASCII digits. The normalizer intercepts these at the `onChange` boundary, converts to ASCII for internal processing, and converts back to the locale's digit system for display via `Intl.NumberFormat`. Mobile numeric keyboards on devices set to Persian/Arabic locales similarly produce locale-specific digits — the `inputmode="decimal"` attribute triggers the correct keypad, and all digit systems are accepted.

### Separator handling across locales

| Locale | Decimal    | Grouping                       | Example (123,456.78)         |
| ------ | ---------- | ------------------------------ | ---------------------------- |
| en-US  | . (U+002E) | , (U+002C)                     | 123,456.78                   |
| de-DE  | , (U+002C) | . (U+002E)                     | 123.456,78                   |
| fr-FR  | , (U+002C) | (U+202F narrow no-break space) | 123 456,78                   |
| fa-IR  | ٫ (U+066B) | ٬ (U+066C)                     | ۱۲۳٬۴۵۶٫۷۸                   |
| ar-EG  | ٫ (U+066B) | ٬ (U+066C)                     | ١٢٣٬٤٥٦٫٧٨                   |
| hi-IN  | . (U+002E) | , (U+002C)                     | 1,23,456.78 (lakh grouping)  |
| bn-BD  | . (U+002E) | , (U+002C)                     | ১,২৩,৪৫৬.৭৮ (Bengali + lakh) |

The parser handles **all** these variants automatically by extracting separator characters from `formatToParts()` rather than hardcoding them.

---

## 8. Build tooling and publishing

### Build tool: tsup

**tsup** is selected for its near-zero configuration, esbuild-powered speed (~200ms builds), and native dual ESM/CJS + DTS generation. Configuration:

```typescript
// tsup.config.ts
export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      core: "src/core/index.ts",
      react: "src/react/index.ts"
    },
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    banner: { js: '"use client";' },
    outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" })
  },
  {
    entry: {
      "locales/fa": "src/locales/fa.ts",
      "locales/ar": "src/locales/ar.ts"
    },
    format: ["cjs", "esm"],
    dts: true,
    external: ["react", "react-dom"]
  }
])
```

### package.json exports

```json
{
  "name": "raqam",
  "version": "1.0.0",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./core": {
      "import": { "types": "./dist/core.d.ts", "default": "./dist/core.js" },
      "require": { "types": "./dist/core.d.cts", "default": "./dist/core.cjs" }
    },
    "./locales/*": {
      "import": {
        "types": "./dist/locales/*.d.ts",
        "default": "./dist/locales/*.js"
      },
      "require": {
        "types": "./dist/locales/*.d.cts",
        "default": "./dist/locales/*.cjs"
      }
    }
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "files": ["dist", "README.md", "LICENSE"]
}
```

### Bundle size targets

| Entry point                  | Target (min+gzip) |
| ---------------------------- | ----------------- |
| `raqam/core`                 | < 2 KB            |
| `raqam` (hooks + components) | < 5 KB            |
| Each locale plugin           | < 0.3 KB          |
| Full package (all locales)   | < 7 KB            |

Monitoring via **size-limit** with CI integration (`andresz1/size-limit-action`). Validation via **publint** and **@arethetypeswrong/cli** before every release.

### TypeScript configuration

Target **ES2020** (optional chaining, nullish coalescing, BigInt support). Strict mode enabled with `verbatimModuleSyntax: true` for correct ESM/CJS dual output. `jsx: "react-jsx"` for automatic runtime. `moduleResolution: "bundler"` for development, validated against `"nodenext"` consumers via arethetypeswrong.

---

## 9. Testing strategy

### Framework: Vitest + React Testing Library

Vitest is chosen over Jest for native ESM support, shared Vite config, and faster execution. **Four testing layers** ensure comprehensive coverage:

**Layer 1 — Core unit tests** (~60% of test suite): Pure function tests for the formatter, parser, normalizer, and cursor engine. No React, no DOM. These run in Node.js and cover every locale permutation, every digit system, edge cases for partial input, paste normalization, and boundary computation.

```typescript
describe("cursor engine", () => {
  it("preserves cursor after comma insertion", () => {
    const boundary = getCaretBoundary("1,234")
    expect(boundary).toEqual([true, true, false, true, true, true])
    expect(computeNewCursor("1234", 4, "1,234", boundary)).toBe(5)
  })
})
```

**Layer 2 — React integration tests** (~25%): Hook and component tests using React Testing Library with `userEvent`. Tests for controlled/uncontrolled state, form submission, keyboard interactions, wheel events, and focus management. Cursor position assertions use `input.selectionStart`.

**Layer 3 — Accessibility tests** (~10%): Every component variant tested with `jest-axe` for WCAG violations. Manual ARIA attribute assertions for spinbutton role, value properties, and label associations.

**Layer 4 — Browser tests** (~5%): Playwright component tests for cursor behavior that jsdom cannot simulate accurately (particularly selection ranges during rapid typing and IME composition). Run in CI against Chrome, Firefox, and Safari.

### i18n testing approach

Dedicated test suites for each supported locale, verifying:

- Correct `formatToParts()` output extraction for separators
- Round-trip parsing: `format(parse(formatted)) === formatted`
- Persian digit input → ASCII normalization → correct numeric value
- Arabic-Indic digit input → same
- Indian lakh/crore grouping with `hi-IN` locale
- RTL rendering attributes applied correctly

---

## 10. Documentation and developer experience

### Documentation stack

**Storybook 8** for interactive component development, visual testing, and auto-generated prop documentation from TypeScript interfaces. Each feature gets a dedicated story: live formatting, Persian input, currency formatting, react-hook-form integration, Tailwind styling, shadcn/ui composition.

**Starlight (Astro)** for the documentation website. Fast static generation, built-in search, dark mode, and MDX support for embedding live Sandpack playgrounds. Sections: Getting Started, Hook API Reference, Component API Reference, Locale Guide, Recipes (financial app, e-commerce, design system integration).

### Consumer use case recipes

Each recipe is a complete, copy-pasteable example:

- **Tailwind + Hook API**: Full custom-styled number input using `useNumberField` with Tailwind classes
- **shadcn/ui wrapper**: A `components/ui/number-field.tsx` file in shadcn convention using headless components
- **Financial app**: Currency input with `$` prefix, `maximumFractionDigits: 2`, `fixedDecimalScale`
- **Persian e-commerce**: `locale="fa-IR"` with rial suffix, live Persian digit formatting
- **react-hook-form**: `Controller` wrapping both hook and component APIs
- **Next.js App Router**: Server Component page with client number input, demonstrating `"use client"` boundary

---

## 11. Open source release checklist

### Pre-release

- MIT License (de facto standard for React ecosystem, maximum adoption)
- Semantic versioning via **Changesets** with automated changelog generation
- `CONTRIBUTING.md` with development setup, coding standards, PR process
- `CODE_OF_CONDUCT.md` (Contributor Covenant)
- Issue templates for bugs, feature requests, and locale support requests
- GitHub Actions CI pipeline: lint (ESLint flat config + Biome), typecheck, test (matrix: React 18 + 19), build, size-limit check, publint validation
- NPM provenance enabled (`publishConfig.provenance: true`) for verified badge
- Automated release via Changesets GitHub Action: creates version PR, publishes on merge

### Post-release

- Bundle size badge in README (via bundlephobia)
- TypeScript types badge
- npm provenance badge
- Storybook deployed to GitHub Pages or Chromatic
- Docs site deployed to Vercel/Netlify
- Submit to shadcn/ui community components registry
- Announce on r/reactjs, Twitter/X, dev.to

---

## 12. Implementation roadmap

### Phase 1 — Foundation (weeks 1–3)

Build the core engine with zero React dependency:

- `formatter.ts`: Wrapper around `Intl.NumberFormat` with `formatToParts()` decomposition and live formatting support (preserving intermediate states like trailing decimals)
- `parser.ts`: Locale-aware parser using dynamically extracted separators. `NumberParser` class that caches locale metadata.
- `normalizer.ts`: Unicode digit normalization with pluggable digit block registration
- `cursor.ts`: `getCaretBoundary()` and `computeNewCursorPosition()` implementing the accepted-characters algorithm
- Full unit test suite for core (target: **100% branch coverage** on core)

### Phase 2 — React hooks (weeks 3–5)

- `useControllableState`: Battle-tested controlled/uncontrolled pattern with dev-mode warnings
- `useNumberFieldState`: State management integrating core formatter/parser, handling intermediate states, increment/decrement with step/clamp logic
- `useNumberField`: Behavior hook returning prop objects with full ARIA, keyboard handlers, wheel handler, focus management
- `useLiveFormat`: Internal hook encapsulating the onChange → cursor computation → useLayoutEffect restoration cycle
- Integration tests with React Testing Library

### Phase 3 — Headless components (weeks 5–7)

- `NumberField.Root`: Context provider, state orchestration
- `NumberField.Input`, `.Increment`, `.Decrement`, `.Group`, `.Label`: Compound components consuming context, supporting `render` prop
- `NumberField.ScrubArea` + `.ScrubAreaCursor`: Pointer Lock API integration
- Hidden input for form submission
- Data attributes for CSS styling
- Full accessibility test suite

### Phase 4 — Locale plugins and i18n (weeks 7–8)

- Persian (`fa`), Arabic (`ar`), Bengali (`bn`), Hindi (`hi`), Thai (`th`) locale plugins
- RTL rendering logic
- Integration tests with each locale
- Playwright browser tests for cursor behavior in RTL

### Phase 5 — Polish and release (weeks 8–10)

- Storybook stories for all features and use cases
- Documentation site with Starlight
- react-hook-form and Formik integration recipes
- Next.js App Router compatibility verification
- Bundle size optimization pass
- Beta release → community feedback → stable v1.0

---

## 13. Why this package wins

### The unique value proposition in one sentence

**Raqam is the only React number input that formats live while you type, accepts digits from any writing system, works with any design system, and meets WAI-ARIA accessibility standards — all in under 5 KB.**

Every competitor forces a trade-off. React Aria makes you choose between accessibility and live formatting. Mantine makes you choose between live formatting and design system independence. react-number-format makes you choose between formatting and spinbutton behavior. Base UI makes you choose between headless composability and i18n input support.

Raqam eliminates all four trade-offs by layering a framework-agnostic formatting/parsing/cursor core beneath React-specific state and behavior hooks, exposed through both a Hook API (for maximum control) and a Headless Component API (for rapid integration). The locale plugin system means Persian support adds **< 300 bytes** only when imported, keeping the default bundle lean for English-only consumers while making the package genuinely usable for the **500+ million** Persian and Arabic speakers who deserve number inputs that accept their native digits.

The live formatting engine — built on the same cursor-boundary algorithm that makes react-number-format the most-downloaded formatter in the ecosystem — is the technical moat. It's the feature users notice immediately, the feature competitors have avoided because it's hard, and the feature that makes financial, e-commerce, and data-entry applications feel polished rather than unfinished.

---

## Conclusion

This specification covers every layer needed to build a production-grade package: the cursor preservation algorithm that makes live formatting possible without flicker, the `Intl.NumberFormat` + `formatToParts()` foundation that makes locale support systematic rather than ad-hoc, the dual Hook/Component API that makes adoption friction-free for any consumer, and the build/test/publish infrastructure that makes maintenance sustainable. The three highest-risk implementation areas are **cursor positioning during rapid typing** (mitigated by the proven accepted-characters algorithm), **edge cases in locale-specific separator parsing** (mitigated by dynamic extraction via `formatToParts()`), and **React 18/19 cross-version behavior differences** (mitigated by CI matrix testing). With these risks addressed, the package fills a genuine gap in the React ecosystem — one that has persisted because solving all four dimensions simultaneously requires deep expertise in formatting algorithms, Unicode, accessibility, and React component architecture. This document provides the complete blueprint to build it.
