# Phase 4 Worklog: Locale Plugins & i18n

**Status:** ✅ COMPLETE  
**Branch:** `claude/phase-4-implementation-Uqhgc`  
**Date:** 2026-04-03  
**Tests:** 219 → 337 passing (118 new; 0 failures)

---

## What Phase 4 Required (from DEFINITION.md §12)

> - Persian (`fa`), Arabic (`ar`), Bengali (`bn`), Hindi (`hi`), Thai (`th`) locale plugins
> - RTL rendering logic
> - Integration tests with each locale
> - Playwright browser tests for cursor behavior in RTL

The locale plugins and RTL rendering logic existed from Phases 1–3. Phase 4's work was
**validation** (comprehensive tests + browser-level Playwright infrastructure) plus one
real bug fix discovered through CI: smart backspace over grouping separators.

---

## Commits

| SHA | Description |
|-----|-------------|
| `92a0196` | feat(phase-4): locale i18n integration — tests, RTL, Playwright E2E |
| `3cd0667` | docs: add phase-4 worklog to .memory/ |
| `3707c64` | fix(e2e): extract CT helpers so Playwright can mount components |
| `947430b` | fix(e2e): smart backspace over separator + min/max clamping test timeout |
| `8ca456b` | chore: ignore Playwright runtime artifacts |

---

## A. Locale Plugin Enhancements

### A1. `LOCALE_CODES` exports (fa.ts, ar.ts, hi.ts, bn.ts, th.ts)

Added a `LOCALE_CODES` readonly tuple to each locale plugin so consumers and tests can
programmatically discover which BCP 47 tags each plugin covers:

```typescript
// fa.ts
export const LOCALE_CODES = ["fa", "fa-IR", "fa-AF"] as const;

// ar.ts
export const LOCALE_CODES = ["ar", "ar-EG", "ar-SA", "ar-MA", "ar-DZ", "ar-TN"] as const;

// hi.ts
export const LOCALE_CODES = ["hi", "hi-IN", "mr", "mr-IN", "ne", "ne-NP"] as const;

// bn.ts
export const LOCALE_CODES = ["bn", "bn-BD", "bn-IN"] as const;

// th.ts
export const LOCALE_CODES = ["th", "th-TH"] as const;
```

### A2. Fixed `locales/index.ts` barrel export

The barrel used `export * from "./fa.js"` etc. After adding `LOCALE_CODES` to each
plugin, all five modules exported a symbol named `LOCALE_CODES`, causing TypeScript
error TS2308 (ambiguous re-export). Fixed by using aliased named re-exports:

```typescript
export { LOCALE_CODES as FA_LOCALE_CODES } from "./fa.js";
export { LOCALE_CODES as AR_LOCALE_CODES } from "./ar.js";
// ... etc.
```

Named re-exports still evaluate the entire source module, so `registerLocale()` calls
(the digit-block side effects) are triggered correctly.

---

## B. RTL Input Enhancement

### B1. `data-rtl` attribute (src/react/useNumberField.ts)

Added `"data-rtl": localeInfo.isRTL ? "" : undefined` to the input props alongside the
existing inline styles. This enables:
- Pure-CSS RTL-specific overrides: `[data-rtl] { border-color: blue; }`
- Easy DOM queries in E2E tests without inspecting computed styles
- Consistency with the existing `data-disabled`, `data-readonly`, `data-invalid` pattern

The inline styles (`direction: ltr; text-align: right; unicodeBidi: embed`) remain
unchanged — they're the functional layer, `data-rtl` is the styling hook.

---

## C. Bug Fix: Smart Backspace Over Grouping Separator

### Problem

`cursor.ts` had an `acceptedCount - 1` adjustment for the backspace-over-separator case
(lines 105–113), but it was dead code. By the time React's `onChange` fires, the browser
has already removed the separator character — so `oldInput[cursor-1]` is a digit, never
a comma. Without a fix, pressing Backspace with the cursor right after "1,|234" would
remove the comma, which then immediately re-appeared on the next render, leaving the user
unable to delete past grouping separators.

### Fix (src/react/useNumberField.ts `handleKeyDown`)

Intercept `Backspace` in `handleKeyDown` **before** the browser acts. When the cursor
sits immediately after a grouping separator (no text selection, no modifier keys):
1. `preventDefault()` — stop the browser's default deletion
2. Remove both the separator (`cursor - 1`) and the preceding digit (`cursor - 2`)
3. Parse and reformat the result
4. Stash `pendingCursor.current = cursor - 2` for `useLayoutEffect` restoration

```typescript
if (key === "Backspace" && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
  const cursor = input.selectionStart ?? 0;
  const info = formatter.getLocaleInfo();
  if (cursor === selEnd && cursor >= 2 && currentValue[cursor - 1] === info.groupingSeparator) {
    e.preventDefault();
    const rawEdited = currentValue.slice(0, cursor - 2) + currentValue.slice(cursor);
    const parseResult = parser.parse(rawEdited);
    state.setInputValue(parseResult.value !== null ? formatter.format(parseResult.value) : rawEdited);
    pendingCursor.current = cursor - 2;
    return;
  }
}
```

Added `formatter` and `parser` to `handleKeyDown`'s `useCallback` dependency array.

Two Vitest unit tests added to `NumberField.test.tsx` to cover the behaviour in jsdom
as a regression guard.

---

## D. Locale Integration Tests (Vitest + React Testing Library)

### D1. `src/locales/test-utils.ts`

Shared helper module (not exported publicly) providing:
- `getLocaleInfo(locale)` — extracts separators/RTL flag from formatter
- `fmt(locale, value, opts?)` — format a number with given locale
- `parse(locale, input)` — parse a formatted string back to number
- `roundTrip(locale, value, opts?)` — verify format→parse identity
- `toLocaleDigits(locale, ascii)` — convert ASCII digits to locale script via Intl
- `localeUsesNativeDigits(locale)` — detect whether runtime ICU produces non-Latin digits

### D2. `src/locales/locale-integration.test.tsx` (61 tests)

| Group | Tests | Coverage |
|-------|-------|----------|
| LOCALE_CODES metadata | 5 | Each plugin's exported array |
| Separator extraction | 8 | Decimal/grouping for en-US, de-DE, fa-IR, ar-EG, he-IL, hi-IN, th-TH, bn-BD |
| Round-trip format/parse | 13 | 13 locale×value combinations |
| Lakh/crore grouping | 4 | hi-IN and bn-BD grouping patterns |
| Unicode digit normalization | 10 | All 5 scripts + ASCII pass-through + mixed |
| Parser: locale digit strings | 10 | Round-trip and raw digit string parsing |
| React component digit input | 7 | fa-IR, ar-EG, hi-IN, bn-BD, th-TH typed input → numberValue |
| Test utilities self-test | 4 | toLocaleDigits, localeUsesNativeDigits |

### D3. `src/react/rtl.test.tsx` (55 tests)

| Group | Tests | Coverage |
|-------|-------|----------|
| RTL locales: BiDi styles | 24 | 6 RTL locales × 4 assertions each (direction, textAlign, unicodeBidi, data-rtl) |
| LTR locales: no RTL styles | 18 | 9 LTR locales × 2 assertions (no direction, no data-rtl) |
| aria-valuetext | 3 | fa-IR, ar-EG, en-US |
| role=spinbutton | 2 | fa-IR, ar-EG |
| Keyboard increment/decrement | 2 | ArrowUp in fa-IR, ArrowDown in ar-EG |
| Locale-switch rerenders | 2 | LTR→RTL and RTL→LTR |
| type/inputmode independence | 4 | All locales: type=text, inputmode=decimal |

**RTL locales tested:** `fa-IR`, `ar-EG`, `ar-SA`, `ar`, `he-IL`, `ur-PK`  
**LTR locales tested:** `en-US`, `de-DE`, `fr-FR`, `hi-IN`, `bn-BD`, `th-TH`, `zh-CN`, `ja-JP`, `ko-KR`

---

## E. Playwright Browser Tests

### E1. Installation

`@playwright/experimental-ct-react@1.59.1` and `@playwright/test@1.59.1` added as
devDependencies. Browser binaries not downloadable in this environment (no network
access); CI handles installation via `npx playwright install --with-deps`.

### E2. `playwright-ct.config.ts`

- Uses `@playwright/experimental-ct-react` for in-browser React component rendering
- Alias map: `numra/*` → `./src/*`
- Projects: Chromium, Firefox, WebKit
- `retries: 2` in CI, `workers: 1` in CI

### E3. `playwright/index.html` + `playwright/index.tsx`

Mount point. `index.tsx` pre-imports all 5 locale plugins globally.

### E4. `e2e/components/cursor-test-field.tsx` + `e2e/components/locale-input-field.tsx`

Extracted shared component helpers (added in `3707c64` after CI revealed Playwright
couldn't resolve inline component definitions from spec files):
- `TestField` — bare input with locale prop for cursor tests
- `Field` — input + inc/dec buttons for locale input tests

### E5. `e2e/rtl-cursor.spec.tsx` (11 tests)

1. en-US control group: cursor after separator insertion; backspace over comma
2. fa-IR: cursor at end after typing; each digit keeps cursor at end
3. fa-IR backspace: separator + preceding digit deleted
4. ar-EG: cursor at end; each digit keeps cursor at end
5. RTL attributes in browser: `data-rtl`, computed `direction: ltr`, en-US has no `data-rtl`
6. Paste: cursor at end after paste

### E6. `e2e/locale-input.spec.tsx` (23 tests)

1. `aria-valuenow` is always a number (5 locales)
2. ASCII digit input accepted in every locale (7 locales)
3. Increment/decrement buttons in RTL locales (fa-IR, ar-EG, hi-IN)
4. min/max clamping (fa-IR, ar-EG) — second click uses `{ force: true }`
5. Keyboard ArrowUp/Down (fa-IR, ar-EG, Shift+ArrowUp)
6. Formatted display (en-US "1,234", de-DE "1.234")

---

## F. CI Integration

### F1. `.github/workflows/e2e.yml`

Parallel matrix of Chromium, Firefox, WebKit. Each job installs only its own browser
via `npx playwright install --with-deps ${{ matrix.project }}`, runs
`pnpm test:e2e --project=...`, uploads HTML report artifact on failure (14-day retention).

### F2. `.gitignore`

Added `playwright-report/`, `test-results/`, `playwright/.cache/` — Playwright runtime
artifacts that must not be committed.

### F3. `package.json` scripts

```json
"test:e2e": "playwright test -c playwright-ct.config.ts",
"test:e2e:ui": "playwright test -c playwright-ct.config.ts --ui",
"test:e2e:debug": "playwright test -c playwright-ct.config.ts --headed --project=chromium"
```

---

## Metrics

| Metric | Phase 3 | Phase 4 (final) |
|--------|---------|-----------------|
| Vitest tests | 219 | **337** (+118) |
| TypeScript errors | 0 | **0** |
| Build warnings (new) | 0 | **0** |
| Locale plugins | 5 | **5** (+ LOCALE_CODES exports) |
| Playwright test files | 0 | **2** (34 browser tests, CI-ready) |
| CI workflows | 1 | **2** (+e2e.yml) |
| Bug fixes | — | **1** (smart backspace over grouping separator) |

---

## Known Limitations

- **Playwright browsers not downloaded locally** — `storage.googleapis.com` unreachable
  in this dev environment. Run `npx playwright install` locally after gaining network
  access; CI installs on every run.
- **ICU-dependent tests** — assertions that expect locale-native digits (e.g., `۱۲۳` for
  fa-IR) depend on Node.js being built with full-icu. The `localeUsesNativeDigits()`
  helper documents this; round-trip tests are written to be ICU-agnostic.
- **`"sideEffects": false` and locale/index** — the barrel export triggers module
  evaluation via named re-exports. Consumers should import locale plugins individually
  (`import 'numra/locales/fa'`) when bundler dead-code elimination behaviour is uncertain.
