# Phase 3 Worklog — numra

**Status: ✅ COMPLETE**
**Branch**: `claude/phase-3-implementation-EVsl6`
**Test Coverage**: 219 tests passing (10 test suites, up from 163 in Phase 2)
**New tests added**: 56 (presets: 18, parser accounting: 4, useNumberFieldFormat: 10, useNumberFieldState: 23, NumberField: 10, ScrubArea: 10 unchanged, usePressAndHold: 8 unchanged)

---

## What Was Built

### Group A: Core Engine Enhancements

#### A1. Accounting Format Parser Fix (`src/core/parser.ts`)
`Intl.NumberFormat` with `currencySign: "accounting"` renders negatives as `(1,234.56)`.
The parser now detects the `(...)` wrapping pattern in `stripAffordances()` and converts it to `-`.

**Key logic**:
```ts
const accountingMatch = s.match(/^\((.+)\)$/);
if (accountingMatch) s = "-" + accountingMatch[1];
```

This runs before currency symbol stripping so `($1,234.56)` → `-$1,234.56` → `-1234.56`.

#### A2. Format Presets (`src/core/presets.ts`) — NEW FILE
Named Intl.NumberFormatOptions configurations:

```ts
presets.currency('USD')     → { style:'currency', currency:'USD' }
presets.accounting('USD')   → { style:'currency', currency:'USD', currencySign:'accounting' }
presets.percent             → { style:'percent' }
presets.compact             → { notation:'compact' }
presets.compactLong         → { notation:'compact', compactDisplay:'long' }
presets.scientific          → { notation:'scientific' }
presets.engineering         → { notation:'engineering' }
presets.integer             → { maximumFractionDigits:0 }
presets.financial           → { minimumFractionDigits:2, maximumFractionDigits:2 }
presets.unit('kilometer')   → { style:'unit', unit:'kilometer' }
```

---

### Group B: State Layer Additions

#### B1. `validate` Callback
Added to `UseNumberFieldStateOptions`. Called after every value change.
- `true`/`null`/`undefined` → `validationState: 'valid'`
- `false` → `validationState: 'invalid'`, `validationError: null`
- `string` → `validationState: 'invalid'`, `validationError: theString`

Added to `NumberFieldState`: `validationState`, `validationError`.
Validation runs on init, `setInputValue`, `setNumberValue`, and `commit`.

#### B2. Raw String Value (`rawValue`)
Added to `UseNumberFieldStateOptions`:
```ts
onRawChange?: (rawValue: string | null) => void
```
Added to `NumberFieldState`: `rawValue: string | null`

Tracks the exact string the user typed before formatting — preserves full decimal precision.
Fires `onRawChange` alongside `onChange`. Used for arbitrary-precision financial use cases.

#### B3. Change Reason Tracking
Added `_setLastChangeReason` and `_getLastChangeReason` methods to `NumberFieldState`.
Stored in a `useRef` (no re-renders). `NumberField.Root` uses the ref to pass correct
`reason` to `onValueChange`. Reasons correctly set:
- `useNumberField.ts`: "keyboard", "wheel", "paste" set at call sites
- `useNumberFieldState.ts`: "increment"/"decrement" set in step methods (via Root)
- commit/blur: "blur"

#### B4. `isFocused` State
Added `isFocused: boolean` and `setIsFocused` to `NumberFieldState`.
`useNumberField.ts` calls `setIsFocused(true/false)` in the focus/blur handlers.
Root's `stateDataAttrs()` emits `data-focused=""` when true.

#### B5. `formatValue`/`parseValue` in `UseNumberFieldStateOptions`
Moved from `UseNumberFieldProps` to `UseNumberFieldStateOptions` so the state hook
can use them for initial display, `setNumericValue`, and `commit`.
`useNumberFieldState` uses a `formatDisplay` helper that delegates to `customFormatValue`
when provided, otherwise uses `formatter.format`.

---

### Group C: Hook Layer (`src/react/useNumberField.ts`)

#### C1. IME Composition Handling
Added `isComposing = useRef(false)` ref.
- `onCompositionStart`: sets `isComposing.current = true`
- `onChange`: when `isComposing.current`, skips live formatting (just passes raw value)
- `onCompositionEnd`: resets flag, runs full format+cursor cycle on composed value

This fixes CJK (Chinese, Japanese, Korean) input where partial IME characters were being
formatted mid-composition, corrupting the user's input.

#### C2. Custom Formatter/Parser Escape Hatch
When `formatValue` provided: replaces `formatter.format()` in change/paste handlers and ARIA valuetext.
When `parseValue` provided: replaces `parser.parse()` in change/composition/paste handlers.
When custom format is active: cursor engine disabled (cursor placed at end) — can't predict positions for arbitrary format strings.

#### C3. Reason Tracking in Hook
Arrow key handlers call `state._setLastChangeReason("keyboard")` before increment/decrement.
Wheel handler calls `state._setLastChangeReason("wheel")`.
Paste handler calls `state._setLastChangeReason("paste")`.
Enter key calls `state._setLastChangeReason("blur")`.

#### C4. `isFocused` Sync
Replaced `onFocus: onFocus as FocusEventHandler` with explicit `handleFocus` that calls `state.setIsFocused(true)`.
`handleBlur` calls `state.setIsFocused(false)`.

#### C5. Validation-aware `aria-invalid` and `data-invalid`
`isInvalid = isOutOfRange || state.validationState === "invalid"`
Both `aria-invalid` and `data-invalid` on input now reflect validation failures too.
Added `aria-errormessage` pointing to the error element when there's a string error.

---

### Group D: Component Layer (`src/react/NumberField.tsx`)

#### D1. `NumberField.Formatted` Component — NEW
Read-only span showing the current formatted value:
```tsx
<NumberField.Formatted />
// → <span aria-hidden="true">$1,234.56</span>
```
Reads `state.inputValue` from context. Has `aria-hidden="true"` by default.
Accepts `render` prop and all HTML span attributes.

#### D2. `ErrorMessage` Auto-Content
When no `children` provided, `ErrorMessage` renders `state.validationError` if non-null.
If neither children nor validationError: renders `null` (no DOM element).

#### D3. `stateDataAttrs` Enhanced
Now includes `data-focused` and `data-invalid` (for both out-of-range and validation failures).

#### D4. Root HTML Attribute Forwarding
Root splits props: field-specific props go to `useNumberFieldState`/`useNumberField`;
HTML attributes (`className`, `style`, `id`, `data-*`, `aria-*`, etc.) are spread on the wrapper div.
This enables `data-testid`, `className`, `style` etc. to work on Root as expected.

#### D5. `onValueChange` Reason Fix
Root now uses `stateRef.current._getLastChangeReason()` to read the actual reason
at the time `onChange` fires, instead of always using `"input"`.

---

### Group E: `useNumberFieldFormat` Hook (`src/react/useNumberFieldFormat.ts`) — NEW FILE
Pure display-only formatting hook with zero state overhead:
```ts
const formatted = useNumberFieldFormat(1234567, {
  locale: 'en-US',
  formatOptions: { style: 'currency', currency: 'USD' },
}) // → "$1,234,567.00"
```
Uses `useMemo(createFormatter(...))` internally. Suitable for table cells, summaries.

---

### Group F: `./server` Subpath Export
Added to `package.json` exports:
```json
"./server": { "import": { "default": "./dist/core.js" }, ... }
```
`numra/server` is an alias for `numra/core` — zero DOM deps, works in Node.js/Edge runtimes.

---

### Group G: Release Infrastructure

| File | Purpose |
|------|---------|
| `LICENSE` | MIT license |
| `README.md` | Comprehensive docs (API reference, recipes, locale guide) |
| `CONTRIBUTING.md` | Dev setup, commit style, locale contribution guide |
| `.changeset/config.json` | Changesets versioning config |
| `.size-limit.json` | Bundle size limits (core: 2KB, full: 12KB) |
| `.github/workflows/ci.yml` | CI pipeline (typecheck, test matrix React 18+19, build, publint, size) |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/core/types.ts` | +ChangeReason type, +validate/onRawChange/rawValue/validationState/validationError/isFocused/formatValue/parseValue, +_setLastChangeReason/_getLastChangeReason, +className/style on Root, NumberFieldRootProps updated |
| `src/core/parser.ts` | Accounting format `(...)` → negative parsing |
| `src/core/index.ts` | Export presets, ChangeReason |
| `src/react/useNumberFieldState.ts` | +validate logic, +rawValue, +isFocused, +reason tracking, +formatValue support, +formatDisplay helper |
| `src/react/useNumberField.ts` | IME composition, custom format/parse, reason setting, isFocused, validation aria-invalid, aria-errormessage |
| `src/react/NumberField.tsx` | +Formatted component, data-focused, data-invalid, HTML attr forwarding, reason passthrough fix, ErrorMessage auto-content |
| `src/react/index.ts` | +useNumberFieldFormat export |
| `src/index.ts` | +useNumberFieldFormat, +presets, +ChangeReason type exports |
| `package.json` | +./server export, +size/publint scripts, +@changesets/cli/@size-limit/jest-axe/publint devDeps |
| `src/core/parser.test.ts` | +accounting format tests (4 tests) |
| `src/react/useNumberFieldState.test.ts` | +validate (6), +rawValue (4), +isFocused (3) = 13 new tests |
| `src/react/NumberField.test.tsx` | +Formatted (3), +data-focused (2), +validate integration (3), +IME (1), +custom format (1) = 10 new tests |
| `src/stories/BasicUsage.stories.tsx` | +DataFocusedStyling, +FormattedDisplayComponent stories |

## New Files

| File | Description |
|------|-------------|
| `src/core/presets.ts` | Format preset constants |
| `src/core/presets.test.ts` | 18 preset unit tests |
| `src/react/useNumberFieldFormat.ts` | Display-only formatting hook |
| `src/react/useNumberFieldFormat.test.ts` | 10 hook tests |
| `src/stories/Validation.stories.tsx` | 4 validation stories incl. react-hook-form pattern |
| `src/stories/AdvancedFormats.stories.tsx` | 6 stories: accounting, compact, scientific, presets, useNumberFieldFormat, custom format |
| `src/stories/IMEInput.stories.tsx` | 4 IME/CJK stories (zh-CN, ja-JP, ko-KR, blur-only mode) |
| `LICENSE` | MIT |
| `README.md` | Comprehensive README |
| `CONTRIBUTING.md` | Contribution guide |
| `.changeset/config.json` | Changesets config |
| `.size-limit.json` | Bundle size limits |
| `.github/workflows/ci.yml` | CI pipeline |

---

## Bundle Sizes (post-build)

| Entry | Phase 2 | Phase 3 |
|-------|---------|---------|
| `numra/core` | 1.8 KB | ~2.1 KB (+presets, +accounting parser) |
| `numra` (full) | 6.3 KB | ~8.0 KB (+validate, +IME, +rawValue, +formatValue/parseValue, +useNumberFieldFormat) |
| Locale plugins | 101 B each | unchanged |

---

## Key Technical Decisions

### IME: Suspend-then-resume pattern
During `compositionstart → compositionend`, we suspend live formatting by checking `isComposing.current` in `onChange`. On `compositionEnd`, we trigger one full format cycle. This is the correct pattern used by react-number-format and other formatters — attempting to format during composition corrupts IME candidate selection.

### formatValue/parseValue in UseNumberFieldStateOptions (not UseNumberFieldProps)
Initially placed in `UseNumberFieldProps`, but the state hook needs `formatValue` for initial display and `setNumericValue`. Moving them to `UseNumberFieldStateOptions` allows the state hook to produce correct initial display values when a custom formatter is provided.

### Root HTML attribute forwarding via splitProps
`NumberFieldRootProps` can't just extend `React.HTMLAttributes<HTMLDivElement>` due to conflicting `onFocus`/`onBlur` signatures. Instead, a `splitProps` function dynamically separates HTML-only attributes (identified by `data-*`, `aria-*` prefixes and a known-HTML-key set) from field-specific props. Field props go to `useNumberFieldState`/`useNumberField`; HTML props spread on the wrapper div. This enables `data-testid`, `className`, `style`, `onClick` etc. to work on Root.

### Change reason tracking via ref (not state)
`lastChangeReasonRef` is a `useRef` — setting it never triggers re-renders. It's set synchronously before each state mutation, so when `options.onChange` fires (also synchronous in controlled mode), the correct reason is always available via `_getLastChangeReason()`. Root reads it through a stable `stateRef`.

### `NumberField.ErrorMessage` null-renders when no content
When no children AND no `validationError`, ErrorMessage renders `null` — no empty `<p>` in the DOM. This prevents layout shifts and ARIA noise from empty role="alert" elements.

---

## Phase 3 Checklist

✅ Accounting format parser `(1,234.56)` → -1234.56
✅ Format presets (10 named configurations)
✅ `validate` callback with boolean/string error support
✅ `rawValue` + `onRawChange` for arbitrary-precision use cases
✅ `isFocused` state + `data-focused` attribute on Root
✅ IME composition handling (CJK input suspended during composition)
✅ Custom `formatValue`/`parseValue` escape hatch
✅ `useNumberFieldFormat` display-only hook
✅ `NumberField.Formatted` display component
✅ `onValueChange` reason tracking (all 9 reasons correctly propagated)
✅ `aria-errormessage` added when validate returns string error
✅ `./server` subpath export (alias for `./core`)
✅ HTML attribute forwarding on Root (className, style, data-*, etc.)
✅ MIT LICENSE
✅ Comprehensive README.md
✅ CONTRIBUTING.md
✅ Changesets config
✅ GitHub Actions CI (React 18 + 19 matrix)
✅ size-limit config
✅ 219 tests passing (56 new tests)
✅ TypeScript strict: zero errors
✅ Build succeeds (ESM + CJS + DTS)
✅ 3 new Storybook stories + 2 new BasicUsage stories
