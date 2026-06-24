---
"raqam": patch
---

Fix dangling `aria-labelledby` when only `aria-label` is provided

`useNumberField` previously defaulted the input's (and group's) `aria-labelledby`
to `${id}-label` unconditionally, pointing at a `<label>` the consumer may never
render. When you pass `aria-label` instead of rendering a label, this produced a
reference to a non-existent id (the "aria-labelledby attribute doesn't match any
element id" warning) and broke the field's accessible name. The fallback now only
applies when no `aria-label`/`aria-labelledby` is supplied.
