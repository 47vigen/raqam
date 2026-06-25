---
"raqam": minor
---

Fix ReDoS, RTL/scientific parsing, stale change details, runaway steppers, and scrub slider a11y

A second full-source review surfaced a fresh set of defects (none overlapping the
prior round). All fixes ship with regression tests.

**Security**

- Guard the parser against quadratic-backtracking ReDoS. The numeric-validation
  regexes (core `parse`, and the scientific/compact `parseSpecialNotation` used on
  paste) are rewritten without the ambiguous `(?:\d+\.?\d*|\.\d+)` alternation so
  they match in linear time; `parse()` rejects inputs over 256 chars,
  `parseSpecialNotation` over 256, and `handlePaste` discards clipboard text over
  1000 chars before any scan. A long crafted paste can no longer freeze the main
  thread.

**Correctness**

- RTL accounting currency negatives no longer parse as positive. `Intl` prepends
  an invisible bidi mark before the `(` for locales like fa-IR; those marks are
  now stripped before the accounting-paren match, so the negative sign survives
  the format → parse round-trip.
- The core `createParser` now parses scientific/exponent notation
  (`"1.234E3" → 1234`, `"1e3" → 1000`, `"1.5e-3" → 0.0015`) instead of silently
  dropping the exponent and producing a corrupt value; malformed exponents are
  rejected rather than mangled.
- `onValueChange` now reports the `formattedValue` that matches the emitted value.
  It previously read display state one update stale (typing `5` reported `""`),
  via a new synchronously-updated display mirror.
- A custom `parseValue` is now honored on the typing and IME paths — its result is
  threaded through to `numberValue` instead of being re-derived (and discarded) by
  the built-in parser. Previously a non-invertible custom format produced the
  wrong value while typing (the paste path was already correct).
- Press-and-hold steppers no longer repeat forever when the button becomes
  disabled mid-hold (value hits min/max): the repeat loop stops reactively on
  disable, and new `onPointerCancel` / `onLostPointerCapture` handlers stop it on
  touch interruption / pointer-capture loss.
- Fullwidth CJK digits (U+FF10–U+FF19, emitted by full-width IMEs) are now
  normalized to ASCII, so that input parses instead of being rejected.

**Accessibility**

- `<NumberField.ScrubArea>` (`role="slider"`) now exposes `aria-valuenow` /
  `aria-valuemin` / `aria-valuemax` / `aria-valuetext` (and `aria-disabled`), so
  assistive tech announces the current value and range and reflects arrow-key
  scrubbing.

**Maintainability**

- The effective fraction-digit resolution is extracted into a single shared
  helper (`resolveEffectiveFractions`) used by both the state and behavior hooks,
  removing the hand-mirrored duplication that had to stay in sync.
