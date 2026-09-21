---
"raqam": patch
---

Increment/decrement buttons no longer steal focus from the input. Pressing a stepper now prevents the default on `pointerdown` and focuses the input (mouse and pen only, so touch doesn't open the on-screen keyboard). Leaving the field after stepping now fires `onBlur`/`onValueCommitted` with the stepped value, where before it fired early with the old value or not at all.
