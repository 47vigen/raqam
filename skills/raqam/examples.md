# raqam — patterns and examples

Prefer the **live playground** for experimentation: [https://47vigen.github.io/raqam/playground/](https://47vigen.github.io/raqam/playground/)

## Minimal NumberField

```tsx
import { NumberField } from "raqam";

export function QuantityInput() {
  return (
    <NumberField.Root locale="en-US" defaultValue={1} minValue={0}>
      <NumberField.Label>Quantity</NumberField.Label>
      <NumberField.Group>
        <NumberField.Decrement>−</NumberField.Decrement>
        <NumberField.Input />
        <NumberField.Increment>+</NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
```

## Native form submission (best practice)

```tsx
import { NumberField } from "raqam";

export function CheckoutPrice() {
  return (
    <NumberField.Root locale="en-US" name="price" defaultValue={9.99}>
      <NumberField.Label>Price</NumberField.Label>
      <NumberField.Input />
      <NumberField.HiddenInput />
    </NumberField.Root>
  );
}
```

Put `name` on `NumberField.Root`; `HiddenInput` reads that hidden-input wiring
from the root state.

## Currency + presets

```tsx
import { presets, NumberField } from "raqam";

<NumberField.Root
  locale="en-US"
  formatOptions={presets.currency("USD")}
  defaultValue={0}
  minValue={0}
>
  <NumberField.Label>Price</NumberField.Label>
  <NumberField.Input />
</NumberField.Root>
```

More preset names and options: [Format presets](https://47vigen.github.io/raqam/api/presets/).

## Persian locale plugin + suffix

```tsx
import "raqam/locales/fa";
import { NumberField } from "raqam";

<NumberField.Root
  locale="fa-IR"
  formatOptions={{ style: "currency", currency: "IRR" }}
  suffix=" تومان"
/>
```

## Hooks (state + behavior)

```tsx
import { useRef } from "react";
import { useNumberFieldState, useNumberField } from "raqam";

function PriceInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Share one options object — useNumberField builds its own formatter/parser
  // and needs the SAME formatting options as the state hook.
  const options = {
    locale: "en-US",
    formatOptions: { style: "currency", currency: "USD" },
    minValue: 0,
    defaultValue: 1234.56,
  };

  const state = useNumberFieldState(options);
  const { inputProps, labelProps, incrementButtonProps, decrementButtonProps } =
    useNumberField({ ...options, label: "Price" }, state, inputRef);

  return (
    <div>
      <label {...labelProps}>Price</label>
      <button {...decrementButtonProps}>−</button>
      <input ref={inputRef} {...inputProps} />
      <button {...incrementButtonProps}>+</button>
    </div>
  );
}
```

## Display-only (client)

```tsx
import { useNumberFieldFormat } from "raqam";

function PriceDisplay({ price }: { price: number }) {
  const formatted = useNumberFieldFormat(price, {
    locale: "en-US",
    formatOptions: { style: "currency", currency: "USD" },
  });
  return <span>{formatted}</span>;
}
```

## Server-side formatting (RSC, no React in formatter)

```tsx
import { createFormatter } from "raqam/server";

const formatter = createFormatter({
  locale: "en-US",
  formatOptions: { style: "currency", currency: "USD" },
});
const displayPrice = formatter.format(1234.56);
```

## Change metadata / analytics

```tsx
<NumberField.Root
  locale="en-US"
  defaultValue={100}
  onValueChange={(value, { reason, formattedValue }) => {
    analytics.track("amount_changed", { value, reason, formattedValue });
  }}
>
  <NumberField.Input />
</NumberField.Root>
```

Use `onValueChange` when the calling app needs to know whether the change came
from typing, paste, wheel, increment/decrement, blur, or scrubbing.

## Commit-only callback (save the settled value)

```tsx
<NumberField.Root
  locale="en-US"
  formatOptions={{ style: "currency", currency: "USD" }}
  defaultValue={0}
  minValue={0}
  onValueCommitted={(value, { reason }) => {
    // Fires once the value settles: reason "blur" (focus loss) or "keyboard" (Enter).
    void fetch("/api/price", { method: "POST", body: JSON.stringify({ value }) });
  }}
>
  <NumberField.Label>Price</NumberField.Label>
  <NumberField.Input />
</NumberField.Root>
```

`onValueCommitted` fires after formatting + clamping with the final value — use it
instead of `onChange`/`onValueChange` when you only care about the settled value.

## ScrubArea (drag to change)

```tsx
<NumberField.Root locale="en-US" defaultValue={50} minValue={0} maxValue={100}>
  <NumberField.ScrubArea direction="horizontal" pixelSensitivity={2}>
    <NumberField.Label>Opacity</NumberField.Label>
    <NumberField.ScrubAreaCursor>⟺</NumberField.ScrubAreaCursor>
  </NumberField.ScrubArea>
  <NumberField.Input />
</NumberField.Root>
```

The scrub area uses the Pointer Lock API and is keyboard accessible
(`role="slider"`, arrow keys step the value).

## Strict clamp + out-of-range

```tsx
// "strict": reject keystrokes that would push the value out of range.
<NumberField.Root locale="en-US" minValue={0} maxValue={10} clampBehavior="strict">
  <NumberField.Input />
</NumberField.Root>

// allowOutOfRange: keep + commit the typed value, flag it invalid (server validates).
<NumberField.Root locale="en-US" minValue={1} maxValue={5} allowOutOfRange>
  <NumberField.Input />
  <NumberField.ErrorMessage>Out of range</NumberField.ErrorMessage>
</NumberField.Root>
```

## react-hook-form (Controller)

Full recipe: [https://47vigen.github.io/raqam/recipes/react-hook-form/](https://47vigen.github.io/raqam/recipes/react-hook-form/)

Sketch:

```tsx
<Controller
  name="price"
  control={control}
  render={({ field, fieldState }) => (
    <NumberField.Root
      locale="en-US"
      formatOptions={{ style: "currency", currency: "USD" }}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      validate={() => fieldState.error?.message ?? true}
    >
      <NumberField.Label>Price</NumberField.Label>
      <NumberField.Input />
      <NumberField.ErrorMessage />
    </NumberField.Root>
  )}
/>
```

## CSS hooks (data attributes)

Style the root with `data-focused`, `data-invalid`, `data-disabled`,
`data-readonly`, `data-required`, and `data-scrubbing`. For RTL-specific input
styling, target `input[data-rtl]`. See README and
[components](https://47vigen.github.io/raqam/api/components/).

## More recipes (external)

- [Formik](https://47vigen.github.io/raqam/recipes/formik/)
- [Tailwind CSS](https://47vigen.github.io/raqam/recipes/tailwind/)
- [shadcn/ui](https://47vigen.github.io/raqam/recipes/shadcn-ui/)
- [Financial](https://47vigen.github.io/raqam/recipes/financial/)
- [Persian e-commerce](https://47vigen.github.io/raqam/recipes/persian-ecommerce/)
