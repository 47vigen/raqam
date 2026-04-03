# numra Changelog

## 0.1.0-beta.1 (upcoming)

### New package

**numra** — the definitive React number input with live formatting, full i18n, headless architecture, and WAI-ARIA accessibility.

#### Core engine (`numra/core`, `numra/server`)

- **Live formatting** with cursor preservation via the accepted-characters boundary algorithm
- `createFormatter` — `Intl.NumberFormat` wrapper with caching and locale info extraction
- `createParser` — locale-aware parsing with accounting format support (`(1,234.56)` → `-1234.56`)
- `computeNewCursorPosition` + `getCaretBoundary` — 3-stage cursor algorithm
- `normalizeDigits` — Unicode decimal digit normalization (Persian, Arabic-Indic, Devanagari, Bengali, Thai)
- `registerLocale` — plugin API for custom digit blocks
- `presets` — named `Intl.NumberFormatOptions` for currency, accounting, percent, compact, scientific, engineering, integer, financial, unit

#### React hooks (`numra/react`)

- `useNumberFieldState` — state management (controlled/uncontrolled, formatting, clamping, validation, scrubbing, focus)
- `useNumberField` — behavior hook (ARIA spinbutton, keyboard, wheel, paste, copy, IME, cursor)
- `useNumberFieldFormat` — lightweight display-only formatting hook
- `useControllableState` — battle-tested controlled/uncontrolled pattern
- `usePressAndHold` — press-and-hold acceleration for stepper buttons
- `useScrubArea` — Pointer Lock API drag-to-adjust

#### Headless components (`numra`)

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

- `numra/locales/fa` — Persian / Extended Arabic-Indic digits (۰–۹)
- `numra/locales/ar` — Arabic-Indic digits (٠–٩)
- `numra/locales/hi` — Devanagari digits (०–९), supports lakh/crore grouping
- `numra/locales/bn` — Bengali digits (০–৯)
- `numra/locales/th` — Thai digits (๐–๙)

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
- **Server Component compatible** — `numra/server` (= `numra/core`) has zero React dependency
- **`"use client"` directive** — prepended to client bundles for Next.js App Router

#### Bundle sizes

| Entry | Gzipped |
|-------|---------|
| `numra/core` | < 2 KB |
| `numra` | < 9 KB |
| `numra/react` | < 8 KB |
| `numra/locales/fa` | < 0.3 KB |

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
