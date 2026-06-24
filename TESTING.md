# Testing strategy

> Why this document exists: an earlier version of the suite had **414 passing
> tests yet shipped ~25 real bugs** in live typing, formatting and i18n. Green
> tests that don't catch bugs are worse than no tests — they grant false
> confidence. This document records the principles that make raqam's tests
> actually reliable, so we don't regress into theatre.

## The three failure modes we design against

The old suite broke all three of these. Every new behavioral test must avoid them:

1. **Don't bypass the pipeline.** A number input's bugs live in the per-keystroke
   path: `onChange → normalizeDigits → parser → cursor engine → display`. Tests
   that called `setInputValue("1,234.56")` or `fireEvent.change({value})` with a
   pre-baked string skipped that entire path. A test titled *"types 23.58"* that
   never types 23.58 cannot catch a typing bug. **Always type character by
   character through one continuous `userEvent.type` call** (the caret advances
   like a real keyboard); for edits use `setSelectionRange` + `{Backspace}` /
   `initialSelectionStart`.

2. **Don't assert half the truth.** Display and value can diverge: a field can
   *show* `$1,234.56` while committing `123456`, or show `13%` while the value is
   `0.1255`. Every behavioral test asserts **both the display string AND the
   numeric value**, and distinguishes the **live** (pre-blur) experience from the
   **committed** (post-blur) one. Most bugs only appeared mid-typing.

3. **Don't assert buggy behavior.** Several old tests *locked in* the bugs — e.g.
   *"blur on intermediate `23.` clears the field"* asserted data loss as if it
   were correct. Test names state the **user-facing guarantee**, not whatever the
   code happened to do.

## Layers (testing pyramid)

| Layer | Where | What | Speed |
|-------|-------|------|-------|
| **Core unit** | `src/core/*.test.ts` | Pure parser / formatter / cursor / normalizer / presets logic — table-driven, exhaustive. The fast first line of defense. | ⚡⚡⚡ |
| **State unit** | `src/react/useNumberFieldState*.test.ts` | The state machine in isolation (clamp, increment precision, validation, controlled echo). | ⚡⚡ |
| **Behavioral** | `src/react/behavior/*.test.tsx` | The core of the suite. Real continuous typing through the live component, organized by user-facing behavior. Asserts live + committed + value across the locale × field-type matrix. | ⚡ |
| **Structural / a11y** | `src/react/NumberField*.test.tsx`, `rtl.test.tsx`, `ScrubArea.test.tsx` | Rendering, ARIA wiring, prop maps, render props, form integration. | ⚡ |
| **E2E (cross-browser)** | `e2e/*.spec.tsx` (Playwright CT) | A focused smoke of the highest-value flows in real Chromium/WebKit/Firefox. Catches real-browser caret/selection differences jsdom can't. | 🐢 |

## The shared harness

`src/test-utils.tsx` provides the ergonomics that make rule #1 and #2 cheap:

```ts
const r = await type({ formatOptions: { style: "currency", currency: "USD" } }, "1234.56");
expect(r.liveDisplay).toBe("$1,234.56");        // pre-blur
expect(norm(r.committedDisplay)).toBe("$1,234.56"); // post-blur (norm() handles NBSP)
expect(r.committedValue).toBe(1234.56);          // numeric value from aria-valuenow
expect(r.changes).toEqual([1, 12, /* … */]);     // full onChange sequence
```

- `type(props, text, {from})` — continuous typing (optionally from a caret index), returns live + committed display **and** value.
- `paste(props, text)` — clipboard paste.
- `renderField(props)` — the raw harness (`input`, `user`, `value()`, `display()`, `hidden()`, `changes`) for bespoke edit/stepper scenarios.
- `backspaceFromEnd(h, n)` — caret-at-end backspace.
- `norm(s)` — collapse NBSP / narrow-NBSP / bidi marks before comparing locale display strings.

## Behavioral coverage map

`src/react/behavior/` is organized by behavior, not by when a bug was found:

`decimals` · `grouping` · `negatives` · `currency` · `percent` · `notation` ·
`i18n` · `editing` · `controlled` · `steppers` · `flags` · `paste` · `a11y-edge` ·
`matrix` (parameterized locale × field-type × value round-trips).

Each module locks the real bugs that area once had (decimal-swallow, trailing-zero
wipe, controlled desync, percent corruption, ASCII-dot i18n, affordance backspace,
…) as named guarantees.

## Reliability proof: mutation testing

A test only earns trust by going **red** when the behavior breaks. We verify this
by mutation testing: revert a fix in isolation and confirm a named behavioral test
fails. See `scripts/mutation-check.md` for the matrix of `fix → test that catches
it`. This is run on demand, not in CI.

## Running

```bash
pnpm test                       # full unit + behavioral suite (vitest)
pnpm test src/react/behavior    # just the behavioral suite
pnpm test:coverage              # with coverage
pnpm test:e2e                   # Playwright cross-browser (needs `npx playwright install`)
```
