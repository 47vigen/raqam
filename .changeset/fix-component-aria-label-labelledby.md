---
"raqam": patch
---

Fix dangling `aria-labelledby` for the `<NumberField.Input aria-label="…" />` component pattern

The previous fix only covered the headless `useNumberField` path. When using the
component API, `aria-label` (and `aria-labelledby`) are spread onto
`<NumberField.Input>` / `<NumberField.Group>` *after* `aria.*Props`, so the hook
never sees them and its fallback `aria-labelledby` (`${id}-label`) stayed on the
element — dangling when no `<NumberField.Label>` is rendered, and winning over the
consumer's `aria-label`. The components now drop that fallback when the consumer
supplies an `aria-label` directly.
