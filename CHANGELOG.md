# raqam Changelog

## 0.3.2

### Patch Changes

- 8f6cec1: Fix consumer ref cleanups being dropped on React 18

  `mergeRefs` returned a cleanup function from its callback ref. React 19 runs that
  cleanup on detach, but React ≤18 ignores it (logging "A callback ref should not
  return a function") and instead calls the ref with `null` — so a consumer ref's
  cleanup never ran on unmount, and the spurious warning showed up in tests.

  `mergeRefs` now branches on the React version: it keeps returning a cleanup on
  React 19, and on React ≤18 it stashes the per-ref cleanups in a closure and runs
  them when React calls the merged ref with `null`. Composed consumer refs (e.g. on
  `<NumberField.Label>` or a render-prop element) now clean up correctly on both
  React 18 and 19, with no callback-ref warning.

## 0.3.1

### Patch Changes

- 5b133dc: Fix dangling `aria-labelledby` when no label is rendered (all API paths)

  The earlier fix only covered the headless `useNumberField` path. The input's and
  group's `aria-labelledby` defaulted to `${id}-label` unconditionally, which only
  resolves when a label element is actually rendered — otherwise it dangled (the
  "aria-labelledby doesn't match any element id" warning) and, since
  `aria-labelledby` wins over `aria-label`, broke the accessible name.

  `labelProps` now carries a `ref` that registers the label's presence with the
  hook, so `inputProps`/`groupProps` only add `aria-labelledby` when a label is
  genuinely mounted. Because the signal travels on `labelProps` itself, this works
  for every render path — the built-in `<NumberField.Label>`, a custom label built
  from `useNumberFieldContext()` + `aria.labelProps`, and the fully headless hook —
  without dropping the wiring for legitimately-rendered labels (including the
  `role="group"` wrapper). Spread `labelProps` as-is; don't strip its `ref`.

## 0.3.0

### Minor Changes

- 0b5432d: Wire up `onValueCommitted` and the `"clear"` change reason

  `onValueCommitted` was part of the public type and documented, but `NumberField.Root`
  never actually called it. It now fires once the value is committed — on blur
  (`reason: "blur"`) and when the user presses Enter (`reason: "keyboard"`) — after
  formatting and clamping have been applied, and receives the final settled value.
  It is now also accepted on the `useNumberField` hook (via `UseNumberFieldProps`),
  not just the component API.

  The `"clear"` `ChangeReason` is now emitted when an edit empties the field, so
  `onValueChange` consumers can distinguish a deletion-to-empty from ordinary typing.

  `NumberFieldState.commit()` now returns the committed numeric value (`number | null`)
  instead of `void`.

## 0.2.6

### Patch Changes

- 5716c6e: Fix dangling `aria-labelledby` when only `aria-label` is provided

  `useNumberField` previously defaulted the input's (and group's) `aria-labelledby`
  to `${id}-label` unconditionally, pointing at a `<label>` the consumer may never
  render. When you pass `aria-label` instead of rendering a label, this produced a
  reference to a non-existent id (the "aria-labelledby attribute doesn't match any
  element id" warning) and broke the field's accessible name. The fallback now only
  applies when no `aria-label`/`aria-labelledby` is supplied.

## 0.2.5

### Patch Changes

- 7250e32: docs: align all documentation with the shipped API

  - Correct README bundle-size figures to the real CI-enforced numbers
    (core ~1.84 KB, react ~8.1 KB, full ~8.3 KB, locale plugin <200 B).
  - Fix the README API tables: move `formatValue`/`parseValue` to the state hook,
    document `onValueCommitted`, `liveFormat`, `required`, and `className`/`style`,
    and clarify that `useNumberFieldFormat` is client-only (use `createFormatter`
    from `raqam/server` in RSC).
  - Document the correct `data-*` attributes (including `data-required` and
    `data-scrubbing`) and that `data-rtl` is set on the input element.

  No runtime changes — documentation only.

## 0.2.4

### Patch Changes

- ed8b968: fix: resolve number-input typing, formatting, i18n and editing bugs

  End-to-end audit of the live-typing experience across the parser, formatter,
  cursor engine and React hooks. Highlights:

  - decimals are no longer swallowed once grouping appears (>= 1000), and
    trailing-zero / trailing-dot decimals are no longer wiped on blur
  - controlled `value` prop changes now update the display (react-hook-form)
  - currency keeps live grouping while typing; min-fraction padding is applied
    only on commit; percent typing precision fixed (12.55 -> 12.55%/0.1255)
  - locale-probe rewrite: U+2212 minus and decimal separators detected for every
    style; ASCII "." works as the decimal point in fa/ar locales
  - compact/scientific/engineering notation typing & paste keep magnitude;
    `-0` normalized everywhere and `NaN` no longer crashes controlled inputs

  Adds a regression suite (src/react/bugfixes.test.tsx).

## 0.2.3

### Patch Changes

- fix: typing the decimal separator when one already exists moves cursor past it

  When using `fixedDecimalScale` (e.g. value displays as "1.00"), pressing the
  decimal key no longer inserts a duplicate separator that invalidates the value
  and clears the field on blur. The cursor now jumps to just after the existing
  decimal point, enabling the standard financial input pattern:
  "1.00" → type "." → cursor after "." → type "5" → "1.50".

  Locale-aware: only the locale's own decimal separator triggers the jump
  (e.g. "," in de-DE), so the grouping separator is unaffected.

## 0.2.2

### Patch Changes

- 1f007eb: Align DEFINITION.md, Playwright fixture, and phase worklogs with the published `raqam` package name.

## 0.2.1

### Patch Changes

- 250aacd: Patch release to republish the package on npm.

## 0.2.0

### Minor Changes

- d1c28e3: Phase 5 — Polish and release:
  - **Bundle optimization**: `raqam/core` reduced to < 2 KB gzipped; removed `isNonLatinDigit` from core exports (still available via direct `raqam/core/normalizer` import in tests); split tsup config so `raqam/core` (the server-safe entry) does not receive a `"use client"` banner
  - **`"use client"` directive**: Fixed — now correctly prepended to `dist/index.js`, `dist/index.cjs`, `dist/react.js`, `dist/react.cjs` via post-build step (esbuild 0.25+ strips source-level directives from bundled output)
  - **Storybook**: Added `preview.ts` with `layout: "centered"`, table-of-contents, and control matchers; new `HookAPI.stories.tsx` demonstrating `useNumberFieldState` + `useNumberField` hook pair directly
  - **react-hook-form integration**: Upgraded `Validation.stories.tsx` to use real `react-hook-form` `Controller` pattern (was previously simulated); added `react-hook-form` as devDependency
  - **Documentation site**: Complete Starlight docs in `docs/` covering Getting Started, full API reference (useNumberFieldState, useNumberField, NumberField components, useNumberFieldFormat, presets), guides (Locales & i18n, RTL, Next.js App Router, Accessibility), and recipes (react-hook-form, Formik, Tailwind CSS, shadcn/ui, Financial App, Persian E-commerce)
  - **Package scripts**: Added `docs:dev`, `docs:build`, `release:beta`

## 0.1.0-beta.1 (upcoming)

### New package

**raqam** — the definitive React number input with live formatting, full i18n, headless architecture, and WAI-ARIA accessibility.

#### Core engine (`raqam/core`, `raqam/server`)

- **Live formatting** with cursor preservation via the accepted-characters boundary algorithm
- `createFormatter` — `Intl.NumberFormat` wrapper with caching and locale info extraction
- `createParser` — locale-aware parsing with accounting format support (`(1,234.56)` → `-1234.56`)
- `computeNewCursorPosition` + `getCaretBoundary` — 3-stage cursor algorithm
- `normalizeDigits` — Unicode decimal digit normalization (Persian, Arabic-Indic, Devanagari, Bengali, Thai)
- `registerLocale` — plugin API for custom digit blocks
- `presets` — named `Intl.NumberFormatOptions` for currency, accounting, percent, compact, scientific, engineering, integer, financial, unit

#### React hooks (`raqam/react`)

- `useNumberFieldState` — state management (controlled/uncontrolled, formatting, clamping, validation, scrubbing, focus)
- `useNumberField` — behavior hook (ARIA spinbutton, keyboard, wheel, paste, copy, IME, cursor)
- `useNumberFieldFormat` — lightweight display-only formatting hook
- `useControllableState` — battle-tested controlled/uncontrolled pattern
- `usePressAndHold` — press-and-hold acceleration for stepper buttons
- `useScrubArea` — Pointer Lock API drag-to-adjust

#### Headless components (`raqam`)

- `NumberField.Root` — context provider with full state wiring
- `NumberField.Input` — ARIA spinbutton text input with live formatting
- `NumberField.Label` — auto-wired `<label>`
- `NumberField.Group` — `<div role="group">` wrapper
- `NumberField.Increment` / `NumberField.Decrement` — stepper buttons with press-and-hold
- `NumberField.ScrubArea` / `NumberField.ScrubAreaCursor` — Pointer Lock drag interface
- `NumberField.Formatted` — read-only formatted display span
- `NumberField.Description` — accessible helper text
- `NumberField.ErrorMessage` — `role="alert"` validation error display
- `NumberField.HiddenInput` — raw numeric value for HTML form submission

#### Locale plugins (tree-shakeable, ~100 B each)

- `raqam/locales/fa` — Persian / Extended Arabic-Indic digits (۰–۹)
- `raqam/locales/ar` — Arabic-Indic digits (٠–٩)
- `raqam/locales/hi` — Devanagari digits (०–९), supports lakh/crore grouping
- `raqam/locales/bn` — Bengali digits (০–৯)
- `raqam/locales/th` — Thai digits (๐–๙)

#### Features

- **Min/max/step constraints** with `clampBehavior: "blur" | "strict" | "none"`
- **Prefix/suffix** support (e.g. `prefix="$"`, `suffix=" kg"`)
- **Smart paste** — strips currency symbols, normalizes non-Latin digits, falls back gracefully
- **Copy behavior** — `"formatted" | "raw" | "number"`
- **IME composition** handling (CJK input suspended during composition)
- **Mouse wheel** increment/decrement (non-passive event listener)
- **RTL support** — auto-detected, `direction: ltr; text-align: right` applied
- **`allowOutOfRange`** — skip clamping, set `aria-invalid` for server-side validation
- **Custom validator** — `validate` prop returning `boolean | string | null`
- **Change reason tracking** — `"keyboard" | "wheel" | "paste" | "blur" | "increment" | "decrement" | "scrub" | "input" | "clear"`
- **Raw value** — `onRawChange` for arbitrary-precision financial use cases
- **`data-*` attributes** — `data-focused`, `data-invalid`, `data-disabled`, `data-readonly`, `data-rtl` for CSS styling
- **`render` prop** — element replacement without `asChild` peer dependency
- **Server Component compatible** — `raqam/server` (= `raqam/core`) has zero React dependency
- **`"use client"` directive** — prepended to client bundles for Next.js App Router

#### Bundle sizes

Min + brotli (including dependencies), enforced in CI via `.size-limit.json`:

| Entry              | Size     | CI budget |
| ------------------ | -------- | --------- |
| `raqam/core`       | ~1.84 KB | 2 KB      |
| `raqam`            | ~8.3 KB  | 12 KB     |
| `raqam/react`      | ~8.1 KB  | 10 KB     |
| `raqam/locales/fa` | 189 B    | 0.3 KB    |

#### Documentation

- Complete Starlight documentation site (`docs/`)
- Storybook stories for all features (9 story files)
- Recipes: react-hook-form, Formik, Tailwind CSS, shadcn/ui, financial app, Persian e-commerce
- Guides: Locales & i18n, RTL, Next.js App Router, Accessibility
- API reference: all hooks, components, and presets

#### Testing

- 337 Vitest unit and integration tests
- Playwright browser tests (Chromium, Firefox, WebKit)
- jest-axe accessibility tests
- CI: React 18 + 19 matrix
