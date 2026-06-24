---
"raqam": patch
---

Fix consumer ref cleanups being dropped on React 18

`mergeRefs` returned a cleanup function from its callback ref. React 19 runs that
cleanup on detach, but React ≤18 ignores it (logging "A callback ref should not
return a function") and instead calls the ref with `null` — so a consumer ref's
cleanup never ran on unmount, and the spurious warning showed up in tests.

`mergeRefs` now branches on the React version: it keeps returning a cleanup on
React 19, and on React ≤18 it stashes the per-ref cleanups in a closure and runs
them when React calls the merged ref with `null`. Composed consumer refs (e.g. on
`<NumberField.Label>` or a render-prop element) now clean up correctly on both
React 18 and 19, with no callback-ref warning.
