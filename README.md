# numra

**The definitive React number input: live formatting, full i18n, headless, accessible.**

[![npm version](https://img.shields.io/npm/v/numra)](https://www.npmjs.com/package/numra)
[![bundle size](https://img.shields.io/bundlephobia/minzip/numra)](https://bundlephobia.com/package/numra)
[![license](https://img.shields.io/npm/l/numra)](LICENSE)

## Why numra?

| Feature | Base UI | React Aria | Mantine | numra |
|---------|---------|------------|---------|-------|
| Live formatting | ❌ blur | ❌ blur | ✅ | ✅ |
| Headless | ✅ | ✅ | ❌ | ✅ |
| i18n digit input (Persian, Arabic…) | ❌ | ✅ | ❌ | ✅ |
| Accessibility (WCAG 2.1) | ✅ | ✅✅ | ⚠️ | ✅✅ |
| Bundle size | ~10 KB | ~30 KB | ~60 KB | **< 2 KB core** |

## Installation

```bash
npm install numra
# or
pnpm add numra
```

## Quick start

### Hook API

```tsx
import { useNumberFieldState, useNumberField } from 'numra'
import { useRef } from 'react'

function PriceInput() {
  const state = useNumberFieldState({
    locale: 'en-US',
    formatOptions: { style: 'currency', currency: 'USD' },
    minValue: 0,
    defaultValue: 1234.56,
  })
  const inputRef = useRef(null)
  const { inputProps, labelProps, incrementButtonProps, decrementButtonProps } =
    useNumberField({ label: 'Price' }, state, inputRef)

  return (
    <div>
      <label {...labelProps}>Price</label>
      <button {...decrementButtonProps}>−</button>
      <input ref={inputRef} {...inputProps} />
      <button {...incrementButtonProps}>+</button>
    </div>
  )
}
```

### Headless Component API

```tsx
import { NumberField } from 'numra'

function PriceField() {
  return (
    <NumberField.Root
      locale="en-US"
      formatOptions={{ style: 'currency', currency: 'USD' }}
      defaultValue={1234.56}
      minValue={0}
      onValueChange={(value, { reason }) => console.log(value, reason)}
    >
      <NumberField.Label>Price</NumberField.Label>
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input />
        <NumberField.Increment />
      </NumberField.Group>
      <NumberField.Description>Enter the product price</NumberField.Description>
      <NumberField.ErrorMessage />
    </NumberField.Root>
  )
}
```

## Format presets

```tsx
import { presets, NumberField } from 'numra'

// Currency
<NumberField.Root formatOptions={presets.currency('USD')} />

// Accounting (negatives as parentheses: (1,234.56))
<NumberField.Root formatOptions={presets.accounting('USD')} />

// Percentage
<NumberField.Root formatOptions={presets.percent} />

// Compact: "1.2K", "3.4M"
<NumberField.Root formatOptions={presets.compact} />

// Scientific notation
<NumberField.Root formatOptions={presets.scientific} />

// Integer only
<NumberField.Root formatOptions={presets.integer} />

// Financial (always 2 decimal places)
<NumberField.Root formatOptions={presets.financial} fixedDecimalScale />

// Unit
<NumberField.Root formatOptions={presets.unit('kilometer-per-hour')} />
```

## Locales & i18n

Persian (Farsi) input with native digits:

```tsx
import 'numra/locales/fa'  // registers Persian digit normalization
import { NumberField } from 'numra'

<NumberField.Root
  locale="fa-IR"
  formatOptions={{ style: 'currency', currency: 'IRR' }}
  suffix=" تومان"
/>
```

The user can type `۱٬۲۳۴` (Persian digits) and numra parses it correctly. Supported scripts: Persian (fa), Arabic (ar), Bengali (bn), Hindi (hi), Thai (th).

## Custom validation

```tsx
<NumberField.Root
  minValue={0}
  validate={(value) => {
    if (value === null) return 'Required'
    if (value % 2 !== 0) return 'Must be an even number'
    return true
  }}
>
  <NumberField.Input />
  <NumberField.ErrorMessage /> {/* auto-renders validate() error string */}
</NumberField.Root>
```

## Display-only formatting

```tsx
import { useNumberFieldFormat } from 'numra'

function PriceDisplay({ price }: { price: number }) {
  const formatted = useNumberFieldFormat(price, {
    locale: 'en-US',
    formatOptions: { style: 'currency', currency: 'USD' },
  })
  return <span>{formatted}</span>  // "$1,234.56"
}
```

## Arbitrary-precision string mode

For financial apps that need to avoid IEEE 754 float rounding:

```tsx
<NumberField.Root
  onRawChange={(rawValue) => {
    // rawValue is the exact string the user typed (e.g. "0.1000000001")
    // before any JS float conversion — feed this to your BigDecimal library
    myDecimal.set(rawValue)
  }}
/>
```

The component also exposes `state.rawValue` from the hook API.

## Custom formatter/parser

```tsx
import Decimal from 'decimal.js'

<NumberField.Root
  formatValue={(value) => new Decimal(value).toFixed(8)}
  parseValue={(input) => {
    try {
      const d = new Decimal(input)
      return { value: d.toNumber(), isIntermediate: false }
    } catch {
      return { value: null, isIntermediate: input.endsWith('.') }
    }
  }}
/>
```

## ScrubArea (drag to change value)

```tsx
<NumberField.Root defaultValue={50} minValue={0} maxValue={100}>
  <NumberField.ScrubArea direction="horizontal" pixelSensitivity={2}>
    <NumberField.Label>Opacity</NumberField.Label>
    <NumberField.ScrubAreaCursor>⟺</NumberField.ScrubAreaCursor>
  </NumberField.ScrubArea>
  <NumberField.Input />
</NumberField.Root>
```

## CSS styling with data attributes

```css
/* State-based styling — no JS needed */
[data-focused] { outline: 2px solid blue; }
[data-invalid] { border-color: red; }
[data-disabled] { opacity: 0.5; }
[data-scrubbing] { cursor: ew-resize; }
```

## react-hook-form integration

```tsx
import { Controller } from 'react-hook-form'
import { NumberField } from 'numra'

<Controller
  name="price"
  control={control}
  render={({ field, fieldState }) => (
    <NumberField.Root
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

## Server Components (Next.js App Router)

```tsx
// app/page.tsx — Server Component
import { createFormatter } from 'numra/server'  // zero React deps

const formatter = createFormatter({ locale: 'en-US', formatOptions: { style: 'currency', currency: 'USD' } })
const displayPrice = formatter.format(1234.56)  // "$1,234.56"
```

Client components that accept user input must be in a `"use client"` file — numra marks all client hooks/components automatically.

## API Reference

### `useNumberFieldState(options)`

State management hook. Returns `NumberFieldState`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number \| null` | — | Controlled value |
| `defaultValue` | `number` | — | Uncontrolled default |
| `onChange` | `(value: number \| null) => void` | — | Fires on every change |
| `onRawChange` | `(raw: string \| null) => void` | — | Fires with unformatted string |
| `locale` | `string` | browser | BCP 47 locale tag |
| `formatOptions` | `Intl.NumberFormatOptions` | `{}` | Full Intl options |
| `minValue` | `number` | — | Minimum value |
| `maxValue` | `number` | — | Maximum value |
| `step` | `number` | `1` | Arrow key step |
| `largeStep` | `number` | `step × 10` | Shift+Arrow step |
| `smallStep` | `number` | `step × 0.1` | Ctrl+Arrow step |
| `clampBehavior` | `"blur" \| "strict" \| "none"` | `"blur"` | When to clamp |
| `allowNegative` | `boolean` | `true` | Allow negative values |
| `allowDecimal` | `boolean` | `true` | Allow decimal values |
| `fixedDecimalScale` | `boolean` | `false` | Always show max decimal places |
| `allowOutOfRange` | `boolean` | `false` | Skip clamping (server-side validation) |
| `validate` | `(v: number \| null) => boolean \| string \| null` | — | Custom validation |
| `prefix` | `string` | — | String prefix (e.g. `"$"`) |
| `suffix` | `string` | — | String suffix (e.g. `" تومان"`) |
| `disabled` | `boolean` | `false` | Disable the field |
| `readOnly` | `boolean` | `false` | Read-only mode |

### `useNumberField(props, state, inputRef)`

Behavior hook. Returns `NumberFieldAria` (prop objects for each element).

Additional props beyond state options:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowMouseWheel` | `boolean` | `false` | Wheel to increment/decrement |
| `copyBehavior` | `"formatted" \| "raw" \| "number"` | `"formatted"` | Clipboard content on copy |
| `stepHoldDelay` | `number` | `400` | Press-and-hold delay (ms) |
| `stepHoldInterval` | `number` | `200` | Initial repeat interval (ms) |
| `formatValue` | `(value: number) => string` | — | Custom format function |
| `parseValue` | `(input: string) => ParseResult` | — | Custom parse function |

### `useNumberFieldFormat(value, options)`

Display-only formatting hook. Returns a formatted string. Zero state overhead.

### `NumberField.*` Components

| Component | Description |
|-----------|-------------|
| `Root` | Context provider, state orchestration |
| `Label` | `<label>` with correct `htmlFor` |
| `Group` | `<div role="group">` for input + buttons |
| `Input` | `<input type="text" role="spinbutton">` |
| `Increment` | Increment button with press-and-hold |
| `Decrement` | Decrement button with press-and-hold |
| `HiddenInput` | Hidden `<input>` for FormData |
| `ScrubArea` | Drag-to-increment via Pointer Lock API |
| `ScrubAreaCursor` | Custom cursor during pointer lock |
| `Description` | Help text linked via aria-describedby |
| `ErrorMessage` | Error display with `role="alert"` |
| `Formatted` | Read-only formatted value display |

Every component accepts a `render` prop for element replacement:
```tsx
<NumberField.Increment render={<MyIconButton />}>▲</NumberField.Increment>
// or
<NumberField.Increment render={(props, state) => <MyBtn disabled={!state.canIncrement} {...props} />} />
```

## Bundle size

| Entry | Gzipped |
|-------|---------|
| `numra/core` | < 2 KB |
| `numra` (hooks + components) | < 12 KB |
| `numra/locales/fa` | < 0.3 KB |

## License

[MIT](LICENSE)
