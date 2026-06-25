---
name: raqam
description: Teaches the raqam React number-input library — headless NumberField compound components, useNumberFieldState/useNumberField hooks, Intl presets, locale plugins (fa/ar/bn/hi/th), raqam/server formatting, validation, ScrubArea, accessibility, and form integration. Use when building or debugging currency/percent/unit fields, live-formatted inputs, non-Latin digits, react-hook-form/Formik, Next.js App Router client vs server formatting, or any raqam API.
---

# raqam (React number input)

## Canonical sources (read these for full detail)

- **Docs site:** [https://raqam.vercel.app](https://raqam.vercel.app)
- **README (quick API tables):** [https://github.com/47vigen/raqam/blob/main/README.md](https://github.com/47vigen/raqam/blob/main/README.md)
- **Package:** [https://www.npmjs.com/package/raqam](https://www.npmjs.com/package/raqam)
- **Issues:** [https://github.com/47vigen/raqam/issues](https://github.com/47vigen/raqam/issues)

Do not assume paths inside the raqam repo; always prefer the docs URLs above. Version in this skill reflects the library at publish time; confirm the current version on npm.

## What raqam is

- **Live formatting while typing** using `Intl.NumberFormat` (cursor-safe algorithm; not “format on blur only”).
- **Headless:** no default styles; compound `NumberField.*` or raw hooks.
- **i18n:** locale-driven separators and symbols; optional **locale plugins** for non-Latin digits (Persian, Arabic, Bengali, Hindi, Thai).
- **Accessibility:** WAI-ARIA `spinbutton`, `aria-valuenow` / `aria-valuetext`, keyboard model (↑↓ Home End PgUp/PgDn, modifiers for step sizes).

Peer dependencies: **React 18+** (and `react-dom`).

## Install

```bash
npm install raqam
# or: pnpm add raqam / yarn add raqam
```

## Entry points

| Import | Use for |
|--------|---------|
| `raqam` | `NumberField`, `useNumberFieldState`, `useNumberField`, `useNumberFieldFormat`, `presets` |
| `raqam/react` | Same hooks/components (alternate entry; see docs) |
| `raqam/core` | No React — `createFormatter`, `createParser`, `registerLocale`, `presets` |
| `raqam/server` | **Alias of `raqam/core`** — safe in RSC, edge, Node (zero React deps) |
| `raqam/locales/<lang>` | Side-effect plugins: `fa`, `ar`, `bn`, `hi`, `th` (tree-shakeable) |
| `raqam/locales` | Registers all built-in locale plugins |

Bundle sizes and export map: see README and [Getting Started](https://raqam.vercel.app/docs/getting-started).

## Choose an API

**Compound components (default)** — less boilerplate, context-wired parts:

- Guide: [NumberField components](https://raqam.vercel.app/docs/api/components)
- `NumberField.Root` + `Label`, `Group`, `Input`, `Increment`/`Decrement`, `Description`, `ErrorMessage`, `HiddenInput`, `ScrubArea`, `Formatted`, etc.

**Hook API** — full control over DOM and styling:

- [useNumberFieldState](https://raqam.vercel.app/docs/api/use-number-field-state) — state machine (`inputValue`, `numberValue`, `rawValue`, validation, scrubbing).
- [useNumberField](https://raqam.vercel.app/docs/api/use-number-field) — ARIA props + handlers; requires `inputRef` to the `<input>`.

**Lower-level helpers** — only when building custom primitives or non-React formatting:

- [Core utilities](https://raqam.vercel.app/docs/api/core-utilities) — `createFormatter`, `createParser`, `normalizeDigits`, `registerLocale`, caret helpers.
- [Advanced primitives](https://raqam.vercel.app/docs/api/advanced-primitives) — `useControllableState`, `usePressAndHold`, `useScrubArea`, `NumberFieldContext`, `useNumberFieldContext`.

## Recommended agent path

Use the simplest path that fits the user’s request:

1. **Default:** `NumberField.Root` + compound components.
2. **Need custom DOM or design-system wrappers:** `useNumberFieldState` + `useNumberField`.
3. **Need display-only formatting in React:** `useNumberFieldFormat`.
4. **Need formatting/parsing in RSC, SSR, Edge, or non-React code:** `raqam/server` / `raqam/core`.
5. **Need non-Latin digit input:** import only the needed locale plugin (`raqam/locales/fa`, etc.).
6. **Need analytics/change metadata:** use `onValueChange` (every change + `reason`), not raw `onChange`.
7. **Need the settled value only (persist/save/request):** use `onValueCommitted` (fires on blur/Enter).
8. **Need arbitrary-precision finance flows:** use `onRawChange` / `state.rawValue`, or custom `parseValue` / `formatValue`.

Avoid steering users toward undocumented or stale APIs when a documented path already exists.

## Behavior essentials

- **`locale`:** BCP 47 tag; drives `Intl.NumberFormat` / parsing.
- **`formatOptions`:** standard `Intl.NumberFormatOptions`; use **`presets`** for common cases — [Format presets](https://raqam.vercel.app/docs/api/presets).
- **Controlled vs uncontrolled:** `value`/`onChange` vs `defaultValue`. `onChange` fires whenever the parsed numeric value changes; use `onValueChange` when you need `{ reason, formattedValue }` metadata, or **`onValueCommitted`** when you only want the settled value (fires on blur → `reason:"blur"`, or Enter → `reason:"keyboard"`). See [Getting Started](https://raqam.vercel.app/docs/getting-started).
- **Change reasons** (`onValueChange` details.reason): `"input"`, `"clear"` (edit empties the field), `"paste"`, `"keyboard"`, `"increment"`, `"decrement"`, `"wheel"`, `"scrub"`, `"blur"`.
- **Constraints:** `minValue`, `maxValue`, `step`, `largeStep` (default `step×10`), `smallStep` (default `step×0.1`), `clampBehavior` (`"blur"` clamp on blur / `"strict"` reject out-of-range keystrokes / `"none"`), `allowOutOfRange` (keep + commit out-of-range, set `aria-invalid`), `allowNegative`, `allowDecimal`, `fixedDecimalScale` (needs `maximumFractionDigits`).
- **Live formatting:** formats on every keystroke with a cursor-safe algorithm; **intermediate** values (`1.`, `12.50`, `-`, `.5`) are kept as typed and only normalized on blur. **`compact`/`scientific`/`engineering` notation format on blur** (not live). Percent fields store the *fraction* (`42%` ⇒ `0.42`). Full details: [Formatting & Behavior](https://raqam.vercel.app/docs/guides/formatting).
- **Paste:** strips currency symbols, parses scientific/compact (`1e3`, `1.5K`) and accounting parens `(1,234)` ⇒ negative; unparseable pastes are discarded.
- **Clipboard:** `copyBehavior` `"formatted"` (default) / `"raw"` / `"number"`.
- **Wheel:** opt-in `allowMouseWheel`; only nudges while the input is focused.
- **Validation:** `validate` returning `true` / error string; pairs with `NumberField.ErrorMessage`.
- **Precision / finance:** `onRawChange` and `state.rawValue` for exact string before float conversion; optional custom `formatValue` / `parseValue`.
- **Display-only:** [useNumberFieldFormat](https://raqam.vercel.app/docs/api/use-number-field-format) on the client; **`createFormatter` from `raqam/server`** on the server.
- **Forms:** for native form submission, put `name` on `NumberField.Root` and render `NumberField.HiddenInput`.
- **Hook API gotcha:** when using `useNumberFieldState` + `useNumberField` directly, pass the **same formatting options to both** (the behavior hook builds its own formatter/parser). The `NumberField.*` components do this for you.

## Locales and RTL

- [Locales & i18n](https://raqam.vercel.app/docs/guides/locales) — switching locales, plugins table, `registerLocale` escape hatch.
- [RTL support](https://raqam.vercel.app/docs/guides/rtl) — RTL layout and behavior.

## Next.js

- [Next.js App Router](https://raqam.vercel.app/docs/guides/nextjs) — `"use client"` for inputs; `raqam/server` for Server Components and edge-safe formatting.

## Forms and UI stacks

- [react-hook-form](https://raqam.vercel.app/docs/recipes/react-hook-form)
- [Formik](https://raqam.vercel.app/docs/recipes/formik)
- [Tailwind CSS](https://raqam.vercel.app/docs/recipes/tailwind)
- [shadcn/ui](https://raqam.vercel.app/docs/recipes/shadcn-ui)
- [Financial app patterns](https://raqam.vercel.app/docs/recipes/financial)
- [Persian e-commerce](https://raqam.vercel.app/docs/recipes/persian-ecommerce)

## Styling and UX

- Root **`data-*` attributes** for CSS include `data-focused`, `data-invalid`, `data-disabled`, `data-readonly`, `data-required`, and `data-scrubbing`.
- The input also exposes **`data-rtl`** for RTL-specific styling.
- **ScrubArea:** pointer-lock drag to change value — [components doc](https://raqam.vercel.app/docs/api/components).
- **`render` prop** on compound parts to swap elements without `asChild`.

## Accessibility

- [Accessibility guide](https://raqam.vercel.app/docs/guides/accessibility) — `spinbutton`, keyboard table, focus model (Tab targets input; steppers use arrow keys).

## Interactive exploration

- [Playground](https://raqam.vercel.app/docs/playground)

## When the model needs more detail

1. Open the **exact doc page** from the links above (prefer over guessing APIs).
2. Use **Context7** / current package docs for npm `raqam` if behavior vs version matters.
3. For exhaustive option tables and extra props, see [reference.md](reference.md).
4. For copy-paste patterns, see [examples.md](examples.md).

## Docs site map (official)

| Topic | URL |
|--------|-----|
| Getting Started | [https://raqam.vercel.app/docs/getting-started](https://raqam.vercel.app/docs/getting-started) |
| Playground | [https://raqam.vercel.app/docs/playground](https://raqam.vercel.app/docs/playground) |
| useNumberFieldState | [https://raqam.vercel.app/docs/api/use-number-field-state](https://raqam.vercel.app/docs/api/use-number-field-state) |
| useNumberField | [https://raqam.vercel.app/docs/api/use-number-field](https://raqam.vercel.app/docs/api/use-number-field) |
| NumberField components | [https://raqam.vercel.app/docs/api/components](https://raqam.vercel.app/docs/api/components) |
| Formatting & Behavior | [https://raqam.vercel.app/docs/guides/formatting](https://raqam.vercel.app/docs/guides/formatting) |
| useNumberFieldFormat | [https://raqam.vercel.app/docs/api/use-number-field-format](https://raqam.vercel.app/docs/api/use-number-field-format) |
| Format presets | [https://raqam.vercel.app/docs/api/presets](https://raqam.vercel.app/docs/api/presets) |
| Core utilities | [https://raqam.vercel.app/docs/api/core-utilities](https://raqam.vercel.app/docs/api/core-utilities) |
| Advanced primitives | [https://raqam.vercel.app/docs/api/advanced-primitives](https://raqam.vercel.app/docs/api/advanced-primitives) |
| Locales & i18n | [https://raqam.vercel.app/docs/guides/locales](https://raqam.vercel.app/docs/guides/locales) |
| RTL | [https://raqam.vercel.app/docs/guides/rtl](https://raqam.vercel.app/docs/guides/rtl) |
| Next.js | [https://raqam.vercel.app/docs/guides/nextjs](https://raqam.vercel.app/docs/guides/nextjs) |
| Accessibility | [https://raqam.vercel.app/docs/guides/accessibility](https://raqam.vercel.app/docs/guides/accessibility) |

Recipes are linked from the [docs homepage](https://raqam.vercel.app) sidebar.
