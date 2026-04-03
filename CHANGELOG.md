# raqam Changelog

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

| Entry              | Gzipped  |
| ------------------ | -------- |
| `raqam/core`       | < 2 KB   |
| `raqam`            | < 9 KB   |
| `raqam/react`      | < 8 KB   |
| `raqam/locales/fa` | < 0.3 KB |

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
