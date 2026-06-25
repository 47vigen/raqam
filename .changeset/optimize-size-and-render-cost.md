---
"raqam": patch
---

perf: shrink the bundle and trim per-render work (no API changes)

- **Smaller production bundle.** The dev-only warnings (invalid `formatOptions`, controlled/uncontrolled switch, missing `<NumberField.Root>`) are now wrapped in `process.env.NODE_ENV !== "production"` guards that production bundlers statically dead-code-eliminate, so they ship **zero bytes in production** while still surfacing in development. `dist` keeps the guards, so a consumer's dev build still shows them. Min+brotli: core 2.37 → 2.23 kB, react 9.69 → 9.42 kB, full 9.84 → 9.62 kB.
- **Cheaper renders.** `JSON.stringify(formatOptions)` is now computed once per render instead of in every `useMemo` dependency array (was up to 7 calls/render across the state and behavior hooks).
- **Cheaper keystrokes.** Removed a redundant digit-normalization pass in the cursor engine (the sole caller already normalizes).
- **Internal cleanups.** Deduplicated the label/description mount-tracking into one hook; hoisted a constant out of the paste hot path.

Note: under raw-browser ESM (no bundler), all dev diagnostics are now gated off and the missing-`<NumberField.Root>` error degrades to a short message. Bundler users get the full warnings in development as before.
