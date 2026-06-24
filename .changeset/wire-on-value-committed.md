---
"raqam": minor
---

Wire up `onValueCommitted` and the `"clear"` change reason

`onValueCommitted` was part of the public type and documented, but `NumberField.Root`
never actually called it. It now fires once the value is committed — on blur
(`reason: "blur"`) and when the user presses Enter (`reason: "keyboard"`) — after
formatting and clamping have been applied, and receives the final settled value.
It is now also accepted on the `useNumberField` hook (via `UseNumberFieldProps`),
not just the component API.

The `"clear"` `ChangeReason` is now emitted when an edit empties the field, so
`onValueChange` consumers can distinguish a deletion-to-empty from ordinary typing.

`NumberFieldState.commit()` now returns the committed numeric value (`number | null`)
instead of `void`.
