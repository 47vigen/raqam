---
"numra": minor
---

Phase 5 — Polish and release:

- **Bundle optimization**: `numra/core` reduced to < 2 KB gzipped; removed `isNonLatinDigit` from core exports (still available via direct `numra/core/normalizer` import in tests); split tsup config so `numra/core` (the server-safe entry) does not receive a `"use client"` banner
- **`"use client"` directive**: Fixed — now correctly prepended to `dist/index.js`, `dist/index.cjs`, `dist/react.js`, `dist/react.cjs` via post-build step (esbuild 0.25+ strips source-level directives from bundled output)
- **Storybook**: Added `preview.ts` with `layout: "centered"`, table-of-contents, and control matchers; new `HookAPI.stories.tsx` demonstrating `useNumberFieldState` + `useNumberField` hook pair directly
- **react-hook-form integration**: Upgraded `Validation.stories.tsx` to use real `react-hook-form` `Controller` pattern (was previously simulated); added `react-hook-form` as devDependency
- **Documentation site**: Complete Starlight docs in `docs/` covering Getting Started, full API reference (useNumberFieldState, useNumberField, NumberField components, useNumberFieldFormat, presets), guides (Locales & i18n, RTL, Next.js App Router, Accessibility), and recipes (react-hook-form, Formik, Tailwind CSS, shadcn/ui, Financial App, Persian E-commerce)
- **Package scripts**: Added `docs:dev`, `docs:build`, `release:beta`
