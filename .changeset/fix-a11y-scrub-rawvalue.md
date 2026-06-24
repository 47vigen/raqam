---
"raqam": minor
---

Fix accessibility wiring, scrub robustness, and the raw-value contract; add i18n labels

**Accessibility**

- `<NumberField.Description>` is now associated with the input: the input's
  `aria-describedby` points at the rendered description (and merges with a
  consumer-supplied `aria-describedby`). It uses the same mount-registration ref
  as `labelProps`, so no dangling reference is left when no description renders.
- The increment/decrement button labels are now localizable via the new
  `incrementLabel` / `decrementLabel` props (default `"Increase"` / `"Decrease"`),
  and the scrub area label via `<NumberField.ScrubArea label="…">` /
  `useScrubArea({ label })` (default `"Scrub to change value"`). Previously these
  ARIA strings were hardcoded English in an i18n-first library.

**Correctness**

- Scrub-driven changes now report the `"scrub"` change reason through
  `onValueChange` (keyboard and pointer-lock drag). It was previously left as the
  stale prior reason, and the `"scrub"` reason was never emitted.
- `useScrubArea` clamps `pixelSensitivity` to a minimum of 1px/step. A value of
  `0` (or negative) previously caused an infinite loop that froze the tab on the
  first pointer move.
- `rawValue` / `onRawChange` now emit the unformatted, precision-preserving
  string (grouping separators, currency symbol, prefix/suffix stripped; typed
  trailing zeros preserved) instead of the formatted display string — matching
  the documented "raw string the user typed" contract. Rescaling and
  non-invertible displays (percent, compact, scientific, unit, custom formatters)
  fall back to the canonical numeric string of the value (e.g. a percent field
  showing `50%` yields `"0.5"`, never `"50"`). A new `parser.strip(input)` exposes
  the affordance-stripping used to derive it.

**Performance / DX**

- The internal `Intl.NumberFormat` cache is now a bounded LRU (256 entries), so
  high-cardinality format options (per-row currencies, per-keystroke fraction
  digits) no longer grow it without limit for the process lifetime.
- Cursor restoration uses an isomorphic layout effect, removing React's
  "useLayoutEffect does nothing on the server" SSR warning.
- The native mouse-wheel listener no longer re-subscribes on every render.
- The controlled/uncontrolled dev warning is now gated on
  `process.env.NODE_ENV` so it is dropped from production builds.
