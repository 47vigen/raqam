---
"raqam": patch
---

Fix dangling `aria-labelledby` in the NumberField component API when no `<NumberField.Label>` is rendered

The previous fix only covered the headless `useNumberField` path. In the component
API, `aria-label` / `aria-labelledby` are spread onto `<NumberField.Input>` /
`<NumberField.Group>` *after* `aria.*Props`, so the hook never sees them and its
fallback `aria-labelledby` (`${id}-label`) stayed on the element — dangling when no
`<NumberField.Label>` is rendered, and winning over the consumer's `aria-label`.

`<NumberField.Label>` now registers its presence via context, and both
`<NumberField.Input>` and `<NumberField.Group>` only keep the `${id}-label`
fallback when a label is actually rendered (or drop it when the consumer names the
element directly). This also fixes the `role="group"` wrapper, which previously
kept a dangling reference even when the `aria-label` lived on the child input.
