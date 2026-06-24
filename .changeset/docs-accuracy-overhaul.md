---
"raqam": patch
---

docs: align all documentation with the shipped API

- Correct README bundle-size figures to the real CI-enforced numbers
  (core ~1.84 KB, react ~8.1 KB, full ~8.3 KB, locale plugin <200 B).
- Fix the README API tables: move `formatValue`/`parseValue` to the state hook,
  document `onValueCommitted`, `liveFormat`, `required`, and `className`/`style`,
  and clarify that `useNumberFieldFormat` is client-only (use `createFormatter`
  from `raqam/server` in RSC).
- Document the correct `data-*` attributes (including `data-required` and
  `data-scrubbing`) and that `data-rtl` is set on the input element.

No runtime changes — documentation only.
