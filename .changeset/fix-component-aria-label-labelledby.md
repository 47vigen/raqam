---
"raqam": patch
---

Fix dangling `aria-labelledby` when no label is rendered (all API paths)

The earlier fix only covered the headless `useNumberField` path. The input's and
group's `aria-labelledby` defaulted to `${id}-label` unconditionally, which only
resolves when a label element is actually rendered — otherwise it dangled (the
"aria-labelledby doesn't match any element id" warning) and, since
`aria-labelledby` wins over `aria-label`, broke the accessible name.

`labelProps` now carries a `ref` that registers the label's presence with the
hook, so `inputProps`/`groupProps` only add `aria-labelledby` when a label is
genuinely mounted. Because the signal travels on `labelProps` itself, this works
for every render path — the built-in `<NumberField.Label>`, a custom label built
from `useNumberFieldContext()` + `aria.labelProps`, and the fully headless hook —
without dropping the wiring for legitimately-rendered labels (including the
`role="group"` wrapper). Spread `labelProps` as-is; don't strip its `ref`.
