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
  const state = useNumberFieldState({
    locale: "en-US",
    formatOptions: { style: "currency", currency: "USD" },
    minValue: 0,
    defaultValue: 1234.56,
  });
  const { inputProps, labelProps, incrementButtonProps, decrementButtonProps } =
    useNumberField({ label: "Price" }, state, inputRef);

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

Style using attributes on `NumberField.Root`, for example `data-focused`, `data-invalid`, `data-disabled`, `data-readonly`, `data-rtl`, `data-scrubbing`. See README and [components](https://47vigen.github.io/raqam/api/components/).

## More recipes (external)

- [Formik](https://47vigen.github.io/raqam/recipes/formik/)
- [Tailwind CSS](https://47vigen.github.io/raqam/recipes/tailwind/)
- [shadcn/ui](https://47vigen.github.io/raqam/recipes/shadcn-ui/)
- [Financial](https://47vigen.github.io/raqam/recipes/financial/)
- [Persian e-commerce](https://47vigen.github.io/raqam/recipes/persian-ecommerce/)
