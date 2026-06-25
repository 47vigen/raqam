---
"raqam": minor
---

Fix multi-entry packaging, SSR hydration, numeric edge cases, invalid-config robustness, and DOM/RTL details

A third full-source review (fresh lenses: concurrency, SSR/RSC, packaging,
numeric, invalid-config, DOM events, RTL, types) surfaced a new set of issues.
All fixes ship with tests; 678 tests pass.

**Packaging (highest impact — verified against the built artifact)**

- The build now emits shared chunks for common modules, so `registerLocale()` and
  `NumberFieldContext` are true singletons across entry points. Previously each
  entry (`raqam`, `raqam/core`, `raqam/react`, `raqam/locales/*`) inlined its own
  copy of the normalizer registry and the React context, so `registerLocale` on
  one entry didn't affect parsers from another and mixing `<NumberField.Root>`
  from `raqam` with `useNumberFieldContext` from `raqam/react` threw. (Code
  splitting applies to the ESM output; CJS still inlines per entry.)
- `sideEffects` is now an allowlist of the locale plugins instead of `false`, so
  the documented `import 'raqam/locales/fa'` (and custom `registerLocale`
  side-effect modules) are no longer tree-shaken away.
- Added the bare `./locales` export (and its types), so the documented
  `import 'raqam/locales'` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`.

**SSR / hydration**

- Documented that omitting `locale` formats with the runtime default — the
  browser locale on the client but the host ICU locale on the server — which can
  cause a hydration mismatch; pin `locale` for SSR. Corrected the `locale` JSDoc
  (it does not default to "browser locale" on the server) and added an SSR
  section to the README (also noting label/description ARIA wires up after mount,
  while the native `<label for>` association is present in SSR HTML).

**Numeric robustness**

- `preciseAdd` caps precision and falls back to plain addition when the scaled
  operands exceed `MAX_SAFE_INTEGER` — incrementing large values (e.g. near
  `MAX_SAFE_INTEGER`, or large currency values with a fractional step) no longer
  drops the step or moves the value backwards, and tiny steps no longer overflow
  to `NaN`.
- `clamp` ignores non-finite bounds.

**Invalid / adversarial configuration**

- `step`/`largeStep`/`smallStep` are coerced to a finite positive number
  (`0`/negative/`NaN`/`Infinity` → default), so stepping never dead-ends or emits
  non-finite values; `minValue`/`maxValue` are dropped when non-finite.
- `setNumericValue` never emits a non-finite value (treats it as empty).
- Invalid `formatOptions`/`locale` no longer throw uncaught during render/SSR —
  the formatter falls back to a safe configuration and warns once in dev.

**DOM / RTL**

- Cursor restore and mouse-wheel now resolve the focused element through the
  input's root node, so they work inside a Shadow DOM.
- The scrub area releases pointer lock on unmount (no more stranded hidden cursor)
  and handles a rejected `requestPointerLock()` promise.
- The input uses `unicode-bidi: plaintext` (was `embed`) so an RTL suffix /
  currency name renders on its natural side while digits stay LTR;
  `NumberField.Formatted` now isolates its number from surrounding bidi text and
  mirrors `data-rtl`.

**Types**

- `useControllableState` overloads narrow the return to `T` (no `| undefined`)
  when a `value` or `defaultValue` is supplied.
