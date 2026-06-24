# Mutation check — proving the suite catches the bugs

Coverage tells you a line _ran_; it does not tell you a test would _fail_ if that
line broke. The original raqam suite had high coverage and still shipped ~25 bugs.
The only real proof of a test's value is that it goes **red** when the behavior
regresses.

This is a mutation check: each fix is reverted in isolation (the bug is
re-introduced) and we confirm the matching behavioral test now fails.

Run it:

```bash
python3 scripts/mutation-check.py
```

It edits a source file, runs the one behavioral test that should catch the
regression, records pass/fail, and restores the file with `git checkout`.

## Result — 12 / 12 caught

| # | Fix reverted (mutation) | Source | Test that caught it (went red) |
|---|--------------------------|--------|-------------------------------|
| 1 | trailing-zero/dot decimals get a value (not wiped on blur) | `core/parser.ts` | `behavior/decimals` |
| 2 | percent divides by 100 (value is the fraction) | `core/parser.ts` | `behavior/percent` |
| 3 | `-0` normalized to `0` | `core/parser.ts` | `behavior/negatives` |
| 4 | minus-sign dedup (`1-23`→123, `--5`→-5) | `core/parser.ts` | `behavior/negatives` |
| 5 | controlled `value` change updates the display | `react/useNumberFieldState.ts` | `behavior/controlled` |
| 6 | `allowOutOfRange` steppers don't clamp | `react/useNumberFieldState.ts` | `behavior/steppers` |
| 7 | sub-`1e-6` step not swallowed (exponential `decimalPlaces`) | `react/useNumberFieldState.ts` | `behavior/steppers` |
| 8 | currency keeps live grouping (no mid-typing `.00` pad) | `react/useNumberField.ts` | `behavior/currency` |
| 9 | ASCII `.` typed as the decimal in fa/ar (live native display) | `react/useNumberField.ts` | `behavior/i18n` |
| 10 | neutral locale probe (de-DE percent decimal separator) | `core/formatter.ts` | `behavior/percent` |
| 11 | leading-dot `.507` caret (no `0.075` transposition) | `react/useNumberField.ts` | `behavior/decimals` |
| 12 | native-digit affordance backspace (fa/ar) | `react/useNumberField.ts` | `behavior/editing` |

> Note on redundant fixes: a few behaviors are protected by two independent
> guards (e.g. ASCII-`.` is handled both in the change handler _and_ the cursor
> engine; U+2212 minus is detected by the locale probe _and_ normalized in the
> parser). Reverting only one guard is masked by its sibling, so the mutation
> targets the guard that **solely** owns an observable difference (e.g. the live
> native display, or the de-DE percent separator). That difference is asserted by
> the behavioral test, so the regression is still caught.
