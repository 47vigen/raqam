# Raqam 🔢

<img src="https://raw.githubusercontent.com/47vigen/raqam/main/assets/raqam-poster.jpg" alt="raqam — the definitive React number input" width="100%" />

**La entrada de números definitiva para React: formato en tiempo real, i18n completo, headless y accesible.**

[![npm version](https://img.shields.io/npm/v/raqam)](https://www.npmjs.com/package/raqam)
[![bundle size](https://img.shields.io/bundlephobia/minzip/raqam)](https://bundlephobia.com/package/raqam)
[![CI](https://img.shields.io/github/actions/workflow/status/47vigen/raqam/ci.yml?label=CI)](https://github.com/47vigen/raqam/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/raqam)](LICENSE)

## ✨ ¿Por qué raqam?

| Característica | Base UI | React Aria | Mantine | **raqam** |
|---------|:-------:|:----------:|:-------:|:---------:|
| Formateo en vivo al escribir | ❌ blur | ❌ blur | ✅ | ✅ |
| Verdaderamente headless | ✅ | ✅ | ❌ | ✅ |
| Entrada de dígitos i18n (Persa ۱۲۳, Árabe ١٢٣…) | ❌ | ✅ | ❌ | ✅ |
| WAI-ARIA spinbutton | ✅ | ✅✅ | ⚠️ | ✅✅ |
| Tamaño del bundle | ~10 KB | ~30 KB | ~60 KB | **~2.2 KB core** |

Ningún paquete existente combina las cuatro. raqam lo hace.

## 📦 Instalación

```bash
npm install raqam
# o
pnpm add raqam
```

**Peer dependencies:** React 18 o 19.

## 🚀 Inicio rápido

### Hook API

```tsx
import { useNumberFieldState, useNumberField, type UseNumberFieldStateOptions } from 'raqam'
import { useRef } from 'react'

function PriceInput() {
  // Compartir un único objeto de opciones — useNumberField construye su propio formateador/analizador,
  // por lo que necesita las mismas opciones de formateo que useNumberFieldState. `satisfies`
  // mantiene los tipos literales (ej. style: 'currency') en un proyecto TS estricto.
  const options = {
    locale: 'en-US',
    formatOptions: { style: 'currency', currency: 'USD' },
    minValue: 0,
    defaultValue: 1234.56,
  } satisfies UseNumberFieldStateOptions
  const state = useNumberFieldState(options)
  const inputRef = useRef(null)
  const { inputProps, labelProps, incrementButtonProps, decrementButtonProps } =
    useNumberField({ ...options, label: 'Price' }, state, inputRef)

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
import { NumberField } from 'raqam'

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
        <NumberField.Decrement>−</NumberField.Decrement>
        <NumberField.Input />
        <NumberField.Increment>+</NumberField.Increment>
      </NumberField.Group>
      <NumberField.Description>Enter the product price</NumberField.Description>
      <NumberField.ErrorMessage />
    </NumberField.Root>
  )
}
```

## 🎨 Ajustes preestablecidos de formato (Presets)

```tsx
import { presets, NumberField } from 'raqam'

<NumberField.Root formatOptions={presets.currency('USD')} />           // $1,234.56
<NumberField.Root formatOptions={presets.accounting('USD')} />         // (1,234.56)
<NumberField.Root formatOptions={presets.percent} />                   // 12.3%
<NumberField.Root formatOptions={presets.compact} />                   // 1.2K
<NumberField.Root formatOptions={presets.scientific} />                // 1.23E3
<NumberField.Root formatOptions={presets.integer} />                   // 1,234
<NumberField.Root formatOptions={presets.financial} fixedDecimalScale /> // 1,234.00
<NumberField.Root formatOptions={presets.unit('kilometer-per-hour')} /> // 120 km/h
```

## 🌍 Locales e i18n

Entrada en persa con dígitos nativos — solo importa el plugin y establece el locale:

```tsx
import 'raqam/locales/fa'  // registra la normalización de dígitos ۰–۹ (< 200 B)
import { NumberField } from 'raqam'

<NumberField.Root
  locale="fa-IR"
  formatOptions={{ style: 'currency', currency: 'IRR' }}
  suffix=" تومان"
/>
// el usuario escribe ۱۲۳۴, raqam lo analiza y formatea correctamente en tiempo real
```

Scripts soportados: 🇮🇷 Persa `fa`, 🇸🇦 Árabe `ar`, 🇧🇩 Bengalí `bn`, 🇮🇳 Hindi `hi`, 🇹🇭 Tailandés `th`. El RTL se detecta y maneja automáticamente.

## ✅ Validación personalizada

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
  <NumberField.ErrorMessage /> {/* renderiza automáticamente el string de error de validate() */}
</NumberField.Root>
```

## 👁️ Formateo solo para visualización

```tsx
import { useNumberFieldFormat } from 'raqam'

function PriceDisplay({ price }: { price: number }) {
  const formatted = useNumberFieldFormat(price, {
    locale: 'en-US',
    formatOptions: { style: 'currency', currency: 'USD' },
  })
  return <span>{formatted}</span>  // "$1,234.56"
}
```

También funciona en React Server Components a través de `raqam/server`:

```tsx
import { createFormatter } from 'raqam/server'  // cero dependencias de React

const formatter = createFormatter({
  locale: 'en-US',
  formatOptions: { style: 'currency', currency: 'USD' },
})
const displayPrice = formatter.format(1234.56)  // "$1,234.56"
```

### Notas sobre SSR / hidratación

- **Fija el `locale` para SSR.** Sin un `locale`, el formateo usa el valor predeterminado del entorno: el locale del navegador en el cliente, pero el locale de ICU/OS del host en el servidor. Si difieren, el valor renderizado en el servidor no coincidirá con el primer renderizado del cliente y React registrará un error de hidratación (hydration mismatch). Pasa un `locale` explícito (el mismo en ambos lados) siempre que renderices un valor inicial en el servidor.
- **Los enlaces ARIA de label/description se configuran tras el montaje.** `<NumberField.Label>` se asocia con el input mediante el `htmlFor`/`id` nativo en el HTML de SSR (los lectores de pantalla lo respetan), pero el `aria-labelledby` redundante (y `aria-describedby` para `<NumberField.Description>`) se adjuntan en el cliente después de que el label/description se registren; aparecen post-hidratación, no en el HTML estático.

## 🖱️ ScrubArea (arrastrar para cambiar el valor)

```tsx
<NumberField.Root defaultValue={50} minValue={0} maxValue={100}>
  <NumberField.ScrubArea direction="horizontal" pixelSensitivity={2}>
    <NumberField.Label>Opacity</NumberField.Label>
    <NumberField.ScrubAreaCursor>⟺</NumberField.ScrubAreaCursor>
  </NumberField.ScrubArea>
  <NumberField.Input />
</NumberField.Root>
```

Utiliza la Pointer Lock API para que el cursor nunca choque con el borde de la pantalla durante el arrastre.

## 💄 Estilizado CSS con atributos de datos

```css
/* Todo el estilo basado en estado — no requiere JS */
[data-focused]   { outline: 2px solid blue; }
[data-invalid]   { border-color: red; }
[data-disabled]  { opacity: 0.5; }
[data-readonly]  { background: #f5f5f5; }
[data-required]  { /* estilo para campo requerido */ }
[data-scrubbing] { cursor: ew-resize; }
[data-rtl]       { /* anulaciones específicas para RTL (se establece en el elemento input) */ }
```

`data-focused`, `data-invalid`, `data-disabled`, `data-readonly`, `data-required`, y `data-scrubbing` se establecen en `NumberField.Root`; `data-rtl` (más los atributos de estado) se establecen en el elemento `NumberField.Input`.

## 🔗 Integración con react-hook-form

```tsx
import { Controller } from 'react-hook-form'
import { NumberField } from 'raqam'

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

## ⚡ Modo de cadena de precisión arbitraria

Para aplicaciones financieras que necesiten evitar el redondeo de punto flotante IEEE 754:

```tsx
<NumberField.Root
  onRawChange={(rawValue) => {
    // rawValue es la cadena numérica sin formato y que preserva la precisión
    // (sin separadores de grupo / moneda / prefijos / sufijos, decimal del locale
    // normalizado a ".", se mantienen los ceros finales escritos) — precisión totalmás allá del punto flotante de JS. ej. "0.1000000001" — pásalo a tu librería de BigDecimal
    myDecimal.set(rawValue)
  }}
/>
```

También disponible como `state.rawValue` desde la Hook API.

## 🔧 Formateador / Analizador personalizado

```tsx
import Decimal from 'decimal.js'

<NumberField.Root
  formatValue={(value) => new Decimal(value).toFixed(8)}
  parseValue={(input) => {
    try {
      return { value: new Decimal(input).toNumber(), isIntermediate: false }
    } catch {
      return { value: null, isIntermediate: input.endsWith('.') }
    }
  }}
/>
```

## 📐 Referencia de la API

### `useNumberFieldState(options)`

Hook de gestión de estado — devuelve `NumberFieldState`.

| Prop | Tipo | Predeterminado | Descripción |
|------|------|---------|-------------|
| `value` | `number \| null` | — | Valor controlado |
| `defaultValue` | `number \| null` | — | Valor predeterminado no controlado |
| `onChange` | `(value: number \| null) => void` | — | Se dispara cuando cambia el valor numérico analizado |
| `onRawChange` | `(raw: string \| null) => void` | — | Se dispara con la cadena sin formato |
| `locale` | `string` | browser | Etiqueta de locale BCP 47 |
| `formatOptions` | `Intl.NumberFormatOptions` | `{}` | Opciones completas de Intl |
| `minValue` | `number` | — | Valor mínimo |
| `maxValue` | `number` | — | Valor máximo |
| `step` | `number` | `1` | Paso de las teclas de flecha |
| `largeStep` | `number` | `step × 10` | Paso de Shift+Flecha |
| `smallStep` | `number` | `step × 0.1` | Paso de Ctrl/Meta+Flecha |
| `clampBehavior` | `"blur" \| "strict" \| "none"` | `"blur"` | Cuándo limitar al min/max |
| `allowNegative` | `boolean` | `true` | Permitir valores negativos |
| `allowDecimal` | `boolean` | `true` | Permitir valores decimales |
| `fixedDecimalScale` | `boolean` | `false` | Mostrar siempre el máximo de decimales |
| `allowOutOfRange` | `boolean` | `false` | Omitir limitación (validación en el servidor) |
| `validate` | `(v: number \| null) => boolean \| string \| null` | — | Validación personalizada |
| `prefix` | `string` | — | Prefijo de cadena (ej. `"$"`) |
| `suffix` | `string` | — | Sufijo de cadena (ej. `" تومان"`) |
| `liveFormat` | `boolean` | `true` | Formatear mientras se escribe (desactivar para locales IME) |
| `disabled` | `boolean` | `false` | Deshabilitar el campo |
| `readOnly` | `boolean` | `false` | Modo solo lectura |
| `required` | `boolean` | `false` | Marcar el campo como requerido |

También acepta `maximumFractionDigits`, `minimumFractionDigits`, `formatValue`, y `parseValue` — consulta la [referencia completa de opciones](https://raqam.47vigen.com/docs/api/use-number-field-state).

### `useNumberField(props, state, inputRef)`

Hook de comportamiento — devuelve objetos de props `NumberFieldAria` para cada elemento. Acepta todas las opciones de `useNumberFieldState` más las props exclusivas de comportamiento a continuación:

| Prop | Tipo | Predeterminado | Descripción |
|------|------|---------|-------------|
| `allowMouseWheel` | `boolean` | `false` | Rueda del ratón para incrementar/decrementar |
| `copyBehavior` | `"formatted" \| "raw" \| "number"` | `"formatted"` | Contenido del portapapeles al copiar |
| `stepHoldDelay` | `number` | `400` | Retraso inicial al mantener presionado (ms) |
| `stepHoldInterval` | `number` | `200` | Intervalo de repetición al mantener presionado (ms) |
| `label` / `name` / `id` / `aria-*` | `string` | — | Etiquetado, nombre del formulario y enlace de id |

→ Referencia completa: [`useNumberField`](https://raqam.47vigen.com/docs/api/use-number-field).

### Props extra de `NumberField.Root`

| Prop | Tipo | Descripción |
|------|------|-------------|
| `onValueChange` | `(value, { reason, formattedValue }) => void` | Se dispara en cada cambio, con la `reason` (razón) del cambio |
| `onValueCommitted` | `(value, { reason }) => void` | Se dispara solo al confirmar (`reason: "blur" \| "keyboard"`) |
| `className` / `style` | `string` / `CSSProperties` | Aplicado al wrapper raíz `<div>` |

### `useNumberFieldFormat(value, options)`

Hook de formateo solo para visualización (solo cliente — lleva `"use client"`). Devuelve una cadena formateada sin sobrecarga de estado. Para React Server Components, SSR o Edge, usa `createFormatter` de `raqam/server` en su lugar (mostrado arriba).

### Componentes `NumberField.*`

| Componente | Descripción |
|-----------|-------------|
| `Root` | Proveedor de contexto + orquestación de estado |
| `Label` | `<label>` con enlace `htmlFor` correcto |
| `Group` | `<div role="group">` para input + botones |
| `Input` | `<input type="text" role="spinbutton">` con formateo en vivo |
| `Increment` | Botón de incremento con aceleración al mantener presionado |
| `Decrement` | Botón de decremento con aceleración al mantener presionado |
| `HiddenInput` | `<input>` oculto para envío nativo de FormData |
| `ScrubArea` | Área de arrastre para ajustar mediante Pointer Lock |
| `ScrubAreaCursor` | Cursor personalizado renderizado durante pointer lock |
| `Description` | Texto de ayuda vinculado vía `aria-describedby` |
| `ErrorMessage` | Visualización de error con `role="alert"` |
| `Formatted` | Span de visualización de valor formateado solo lectura |

Cada componente acepta una prop `render` para el reemplazo del elemento:

```tsx
<NumberField.Increment render={<MyIconButton />}>▲</NumberField.Increment>
// o con acceso al estado:
<NumberField.Increment render={(props, state) => (
  <MyBtn disabled={!state.canIncrement} {...props} />
)} />
```

## 📦 Tamaño del bundle

Medido en min + brotli (incluyendo dependencias), forzado en CI vía [`.size-limit.json`](.size-limit.json):

| Entrada | Tamaño | Presupuesto CI |
|-------|------|-----------|
| `raqam/core` | ~2.23 KB | 2.5 KB |
| `raqam` (hooks + componentes) | ~9.62 KB | 12 KB |
| `raqam/react` | ~9.42 KB | 10 KB |
| `raqam/locales/fa` | 196 B | 0.3 KB |

## 📄 Licencia

[MIT](LICENSE)
