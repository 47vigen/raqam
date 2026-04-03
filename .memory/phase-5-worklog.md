# Phase 5 Worklog — Polish and Release

**Status**: ✅ Complete  
**Branch**: `claude/phase-5-implementation-4OSPb`  
**Tests**: 337 passing (unchanged from Phase 4)  
**TypeScript**: 0 errors

---

## What Phase 5 Required

From DEFINITION.md §12:

> - Storybook stories for all features and use cases
> - Documentation site with Starlight
> - react-hook-form and Formik integration recipes
> - Next.js App Router compatibility verification
> - Bundle size optimization pass
> - Beta release → community feedback → stable v1.0

---

## What Was Built

### A. Bundle Size Optimization

**Problem**: `numra/core` was at ~2027 bytes gzipped, 27 bytes over the 2000-byte limit in `.size-limit.json`.

**Root cause**: `isNonLatinDigit` was exported from `core/index.ts` but is only used in tests (which import directly from `normalizer.ts`).

**Fix**: Removed `isNonLatinDigit` from `core/index.ts` and `src/index.ts`.

**Result**: core now at **1967 bytes** (33 bytes under the 2000-byte limit).

Files changed:
- `src/core/index.ts` — removed `isNonLatinDigit` re-export
- `src/index.ts` — removed `isNonLatinDigit` re-export

---

### B. tsup Config Refactor + "use client" Fix

**Problem 1**: The original tsup config applied `banner: { js: '"use client";' }` to ALL entries (core, react, index) from a single config block. The `numra/core` (= `numra/server`) entry should NOT have `"use client"` — it's a server-safe bundle.

**Problem 2**: esbuild 0.25+ strips `"use client"` directives from bundled output (warns about module-level directives) and the banner approach via tsup's `banner` option also gets stripped. Neither source-level directives nor tsup's `banner` option survive bundling.

**Fix**: Split tsup config into 3 blocks:
1. **Core-only** (`src/core/index.ts`) — no banner, clean server-safe output
2. **React + index** (`src/react/index.ts`, `src/index.ts`) — `onSuccess` callback post-processes the 4 output files and prepends `"use client";\n`
3. **Locale plugins** (unchanged)

Also removed the source-level `"use client"` directive from `src/index.ts` (it was causing esbuild warnings without having any effect).

**Result**: 
- `dist/core.js` / `dist/core.cjs` — no `"use client"` directive (correct for server)
- `dist/react.js`, `dist/react.cjs`, `dist/index.js`, `dist/index.cjs` — have `"use client";\n` as first line (correct for Next.js App Router)
- No more build warnings

Files changed:
- `tsup.config.ts` — complete rewrite
- `src/index.ts` — removed `"use client"` source directive

---

### C. Storybook Enhancements

**`.storybook/preview.ts`** — enhanced with:
- `docs.toc: true` — table of contents in autodocs
- `controls.matchers` — automatic color/date control type detection

**`src/stories/HookAPI.stories.tsx`** — new story file (4 stories):
- `MinimalHookUsage` — bare minimum: `useNumberFieldState` + `useNumberField`, spread onto raw DOM elements
- `StateInspector` — shows all state properties in a debug table
- `CustomInputOnly` — hook API with no stepper buttons (arrow keys + wheel only)
- `WithOnChange` — demonstrates the `onChange` callback and event log

---

### D. react-hook-form Integration

**`package.json`** — added `react-hook-form@^7.72.1` as devDependency.

**`src/stories/Validation.stories.tsx`** — upgraded `ReactHookFormIntegration` story:
- Before: simulated react-hook-form with local state + a comment saying "in real usage..."
- After: uses real `useForm` + `Controller` from react-hook-form, with proper `control`, `rules`, `formState.errors`, and `isSubmitSuccessful`

---

### E. Starlight Documentation Site

Created `docs/` as a standalone Astro project with its own `package.json` (Astro + Starlight dependencies separate from the library). 16 documentation pages:

**`docs/package.json`** — `astro`, `@astrojs/starlight`, TypeScript

**`docs/astro.config.mjs`** — Starlight config with:
- Sidebar navigation: Getting Started → API Reference → Guides → Recipes
- Custom CSS accent color overrides
- GitHub social link

**Pages created:**

| File | Content |
|------|---------|
| `docs/src/content/docs/index.mdx` | Landing page — hero, feature cards, quick install, bundle size table |
| `docs/src/content/docs/getting-started.mdx` | Install, controlled/uncontrolled, currency formatting, min/max/step, form integration, TypeScript |
| `docs/src/content/docs/api/use-number-field-state.mdx` | Full props table (30+ options), full return value table (all state + methods) |
| `docs/src/content/docs/api/use-number-field.mdx` | UseNumberFieldProps, NumberFieldAria return keys, keyboard table, clipboard table |
| `docs/src/content/docs/api/components.mdx` | All 11 NumberField.* sub-components with props and examples |
| `docs/src/content/docs/api/use-number-field-format.mdx` | Display-only hook, server-side usage, price table example |
| `docs/src/content/docs/api/presets.mdx` | All 10 presets with types, examples, and locale comparison tables |
| `docs/src/content/docs/guides/locales.mdx` | Locale switching, 5 non-Latin plugins, lakh/crore, custom digit blocks |
| `docs/src/content/docs/guides/rtl.mdx` | RTL auto-detection, CSS applied, Persian + Arabic examples, keyboard nav |
| `docs/src/content/docs/guides/nextjs.mdx` | Client components, `numra/server` for RSC, Edge Runtime, locale plugin pattern |
| `docs/src/content/docs/guides/accessibility.mdx` | Full ARIA attribute table, keyboard table, focus management, jest-axe testing |
| `docs/src/content/docs/recipes/react-hook-form.mdx` | Controller pattern, Zod resolver, multiple currency fields |
| `docs/src/content/docs/recipes/formik.mdx` | `useFormik` pattern, Yup schema, setFieldValue tips |
| `docs/src/content/docs/recipes/tailwind.mdx` | data-* variants, dark mode, compact input, validation styles |
| `docs/src/content/docs/recipes/shadcn-ui.mdx` | `NumraInput` wrapper component, shadcn Form integration, display Badge |
| `docs/src/content/docs/recipes/financial.mdx` | Accounting format, fixed decimal scale, arbitrary precision, currency conversion, change reasons |
| `docs/src/content/docs/recipes/persian-ecommerce.mdx` | Toman suffix, RTL context, digit normalization table, SSR formatting |

---

### F. Release Preparation

**`CHANGELOG.md`** — initial changelog with comprehensive v0.1.0-beta.1 section listing all features from Phases 1–5.

**`.changeset/phase-5-polish.md`** — changeset (`minor`) documenting all Phase 5 changes.

**`package.json`** — added scripts:
- `docs:dev` — `cd docs && astro dev`
- `docs:build` — `cd docs && astro build`
- `release:beta` — `changeset version --snapshot beta && changeset publish --tag beta`

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm test` | ✅ 337 passed (12 test files) |
| `pnpm typecheck` | ✅ 0 errors |
| `pnpm build` | ✅ 0 errors, 0 warnings |
| `gzip -c dist/core.js | wc -c` | ✅ 1967 bytes (< 2000 limit) |
| `"use client"` in dist/react.js | ✅ First line |
| `"use client"` in dist/core.js | ✅ Absent (correct) |

---

## Files Created

```
.changeset/phase-5-polish.md
.storybook/preview.ts              (enhanced)
CHANGELOG.md
docs/
  package.json
  astro.config.mjs
  tsconfig.json
  src/
    styles/custom.css
    content/docs/
      index.mdx
      getting-started.mdx
      api/
        use-number-field-state.mdx
        use-number-field.mdx
        components.mdx
        use-number-field-format.mdx
        presets.mdx
      guides/
        locales.mdx
        rtl.mdx
        nextjs.mdx
        accessibility.mdx
      recipes/
        react-hook-form.mdx
        formik.mdx
        tailwind.mdx
        shadcn-ui.mdx
        financial.mdx
        persian-ecommerce.mdx
src/stories/HookAPI.stories.tsx
```

## Files Modified

```
.changeset/phase-5-polish.md      (created)
package.json                      (added docs:dev, docs:build, release:beta scripts; react-hook-form devDep)
src/core/index.ts                 (removed isNonLatinDigit re-export)
src/index.ts                      (removed isNonLatinDigit, removed "use client" source directive)
src/stories/Validation.stories.tsx (real react-hook-form Controller story)
tsup.config.ts                    (3-block config, onSuccess "use client" post-processor)
```

---

## Metrics

| Metric | Phase 4 | Phase 5 |
|--------|---------|---------|
| Tests | 337 | 337 (unchanged, all passing) |
| TypeScript errors | 0 | 0 |
| Story files | 8 | 9 (+HookAPI) |
| Core bundle (gzip) | ~2027 B | 1967 B ✅ |
| Docs pages | 0 | 17 |
| `"use client"` working | ❌ (stripped) | ✅ (post-build) |
| react-hook-form story | Simulated | Real |

---

## Architecture Decisions

1. **Docs as separate Astro project** — `docs/` has its own `package.json` to keep the library's devDependencies lean. Starlight and Astro are not needed to build the library.

2. **`onSuccess` for `"use client"`** — esbuild 0.27 strips `"use client"` directives from bundled output (they're only valid in un-bundled source). Using `readFileSync`/`writeFileSync` in `onSuccess` is the reliable workaround.

3. **`isNonLatinDigit` removed from exports** — it was the only function in core unused by the library itself. Tests import it directly from `normalizer.ts`. Its removal brought core under the 2 KB limit with no API impact to users (the function was undocumented).

4. **react-hook-form as devDependency** — used only in Storybook stories, never in library code. No peer dependency or runtime dependency needed.
