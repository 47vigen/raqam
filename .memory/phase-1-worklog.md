# Phase 1 Worklog — numra React Number Input Library

**Date**: 2026-04-02  
**Branch**: `claude/phase-1-implementation-plan-5fpI2`  
**Status**: ✅ Complete

---

## What Was Built

### Project Setup
- `package.json` — Full config with subpath exports (`.`, `./core`, `./react`, `./locales/*`), ESM-first, `sideEffects: false`, peer deps for React 18/19
- `tsconfig.json` — ES2020 target, strict, `verbatimModuleSyntax`, `moduleResolution: Bundler`
- `tsup.config.ts` — Dual ESM/CJS output with DTS, minification enabled, separate locale entries
- `vitest.config.ts` — jsdom environment, globals, `@vitejs/plugin-react`

### Core Engine (`src/core/`) — framework-agnostic, 1.8 KB gzipped

| File | Purpose |
|------|---------|
| `types.ts` | All shared TypeScript interfaces and types |
| `normalizer.ts` | Unicode digit normalization (5 built-in digit blocks, extensible registry) |
| `formatter.ts` | `createFormatter()` — Intl.NumberFormat wrapper with caching, prefix/suffix, fixedDecimalScale |
| `parser.ts` | `createParser()` — locale-aware, auto-extracts separators via `formatToParts()`, handles intermediate states |
| `cursor.ts` | `getCaretBoundary()` + `computeNewCursorPosition()` — 3-stage accepted-chars algorithm |
| `index.ts` | Barrel export |

### React Layer (`src/react/`) — 4.3 KB gzipped

| File | Purpose |
|------|---------|
| `useControllableState.ts` | Controlled/uncontrolled pattern with dev-mode warning |
| `context.ts` | `NumberFieldContext` + `useNumberFieldContext()` |
| `useNumberFieldState.ts` | Pure state management — formats, parses, clamps, steps |
| `useNumberField.ts` | Behavior hook — wires cursor engine, ARIA attrs, keyboard, wheel |
| `NumberField.tsx` | Compound headless components: Root, Label, Group, Input, Increment, Decrement, HiddenInput |
| `index.ts` | Barrel export |

### Locale Plugins (`src/locales/`) — ~101 bytes each gzipped

- `fa.ts` — Persian: U+06F0–U+06F9 + U+0660–U+0669
- `ar.ts` — Arabic-Indic: U+0660–U+0669
- `bn.ts` — Bengali: U+09E6–U+09EF
- `hi.ts` — Devanagari: U+0966–U+096F
- `th.ts` — Thai: U+0E50–U+0E59
- `index.ts` — All-in-one side-effect import

---

## Key Technical Decisions Made

### Cursor Algorithm
Implemented the 3-stage accepted-characters boundary algorithm as specified:
1. **Capture** — `selectionStart` + `inputType` from native event
2. **Compute** — count accepted chars (digits, decimal sep, minus) before cursor, format, walk boundary
3. **Restore** — `useLayoutEffect` + `setSelectionRange()` before browser paint

**Bug found and fixed**: Initial implementation had `|| acceptedCount === 0` in the post-loop condition which incorrectly overrode position 0 with string length. This was caught by tests and fixed.

### Parser Bug Fixed
`stripAffordances()` was setting `isIntermediate: true` for lone `-` without checking `allowNegative`. Fixed by separating the empty/minus-only check and gating isIntermediate on the `allowNegative` flag.

### Locale Info Extraction
All separators extracted dynamically from `Intl.NumberFormat.formatToParts()` — never hardcoded. This correctly handles:
- fr-FR narrow no-break space grouping (U+202F)
- fa-IR Arabic digit separators (٫ decimal, ٬ grouping)
- RTL detection via resolved locale

### Dev-Mode Warning
Used `window.__DEV__` pattern instead of `process.env.NODE_ENV` (no Node types needed) or `import.meta.env` (TS config complexity).

---

## Creative Additions Beyond Spec

1. **`valueAsString` architecture** — `inputValue` in state is always accessible as the raw string users see
2. **RTL auto-detection** — locale info includes `isRTL` flag; input gets `direction: ltr; text-align: right` for Arabic/Persian/Hebrew locales automatically
3. **`data-scrubbing` attribute infrastructure** — data attribute slots in stateDataAttrs for Phase 2 ScrubArea
4. **Precision arithmetic** — `preciseAdd()` in useNumberFieldState avoids `0.1 + 0.2 = 0.30000000000000004` float issues

---

## Bundle Sizes Achieved

| Entry | Gzipped | Target | Status |
|-------|---------|--------|--------|
| `numra/core` | 1.8 KB | < 2 KB | ✅ |
| `numra` (full) | 4.5 KB | < 5 KB | ✅ |
| `numra/react` | 4.3 KB | < 5 KB | ✅ |
| `numra/locales/fa` | 101 B | < 0.3 KB | ✅ |

---

## Test Coverage

**124 tests passing across 6 suites:**

| Suite | Tests | What's Covered |
|-------|-------|----------------|
| `normalizer.test.ts` | 17 | Persian/Arabic/Bengali/Hindi/Thai digits, registry |
| `formatter.test.ts` | 17 | en-US, de-DE, fr-FR, fa-IR formatting, currency, fixedDecimalScale |
| `parser.test.ts` | 22 | All locales, intermediate states, allowNegative/allowDecimal, prefix/suffix |
| `cursor.test.ts` | 13 | getCaretBoundary, cursor computation, backspace-on-separator |
| `useNumberFieldState.test.ts` | 26 | State management, controlled/uncontrolled, clamping, steps |
| `NumberField.test.tsx` | 29 | ARIA attrs, keyboard, buttons, form integration, render prop, disabled |

---

## Phase 1 Checklist vs DEFINITION.md Priority 1

| Feature | Status |
|---------|--------|
| Live formatting while typing | ✅ |
| Cursor preservation (accepted-chars algorithm) | ✅ |
| Hook API (`useNumberField` + `useNumberFieldState`) | ✅ |
| Headless Component API (all 7 sub-components) | ✅ |
| Full `Intl.NumberFormat` integration | ✅ |
| Unicode digit normalization (5 scripts) | ✅ |
| Locale-aware parsing | ✅ |
| Min/max/step constraints | ✅ |
| Clamping behavior (blur/strict/none) | ✅ |
| Decimal control | ✅ |
| Negative number support | ✅ |
| Keyboard interactions (arrows, Page, Home/End) | ✅ |
| ARIA spinbutton with all attributes | ✅ |
| Controlled/uncontrolled pattern | ✅ |
| Form integration (hidden input) | ✅ |
| RTL support (auto-detected) | ✅ |
| Render prop pattern for element replacement | ✅ |
| `type="text" inputmode="decimal"` | ✅ |

---

## Known Gaps / Phase 2 Items

- **ScrubArea** — `data-scrubbing` attr slots are ready, implementation deferred
- **Press-and-hold acceleration** — button long-press stepHoldDelay/stepHoldInterval
- **Mouse wheel** — skeleton in `useNumberField` (`allowMouseWheel` prop), needs pointer lock
- **Paste handling** — basic normalization works; smart paste with currency stripping is Phase 2
- **`allowOutOfRange`** — prop defined in types, behavior not yet enforced
- **Storybook** — not configured
- **Changeset / publishing** — not configured
- **Size-limit CI** — not configured yet

---

## Next Steps for Phase 2

1. Implement ScrubArea (Pointer Lock API, configurable sensitivity)
2. Press-and-hold acceleration for stepper buttons
3. Smart paste normalization (strip currency symbols, detect locale)
4. Advanced prefix/suffix from `Intl.NumberFormat` parts positioning
5. Storybook stories for all features
6. Starlight docs site skeleton
7. Changesets for versioning
8. GitHub Actions CI pipeline
