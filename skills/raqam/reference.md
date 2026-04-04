# raqam — reference digest

Use this file for **quick lookup**. Authoritative detail lives in the official docs and README (see [SKILL.md](SKILL.md) canonical links).

## Official references (external)

- **README API tables:** [https://github.com/47vigen/raqam/blob/main/README.md](https://github.com/47vigen/raqam/blob/main/README.md)
- **useNumberFieldState options & state shape:** [https://47vigen.github.io/raqam/api/use-number-field-state/](https://47vigen.github.io/raqam/api/use-number-field-state/)
- **useNumberField props & NumberFieldAria keys:** [https://47vigen.github.io/raqam/api/use-number-field/](https://47vigen.github.io/raqam/api/use-number-field/)
- **NumberField.* components:** [https://47vigen.github.io/raqam/api/components/](https://47vigen.github.io/raqam/api/components/)
- **presets:** [https://47vigen.github.io/raqam/api/presets/](https://47vigen.github.io/raqam/api/presets/)

## useNumberFieldState — option groups (summary)

| Area | Examples |
|------|-----------|
| Value | `value`, `defaultValue`, `onChange`, `onRawChange` |
| Locale / format | `locale`, `formatOptions`, `prefix`, `suffix`, `fixedDecimalScale`, `liveFormat` |
| Bounds / step | `minValue`, `maxValue`, `step`, `largeStep`, `smallStep`, `clampBehavior`, `allowOutOfRange` |
| Input rules | `allowNegative`, `allowDecimal`, `maximumFractionDigits`, `minimumFractionDigits` |
| Validation | `validate` |
| Custom | `formatValue`, `parseValue` |
| UX timing | `stepHoldDelay`, `stepHoldInterval`, `disabled`, `readOnly` |

## NumberField.Root — extras (summary)

Beyond state options, the component API adds callbacks such as **`onValueChange`** (with reason) and **`onValueCommitted`**. See [components doc](https://47vigen.github.io/raqam/api/components/).

## useNumberField — notable props

- **`copyBehavior`:** `"formatted"` | `"raw"` | `"number"` — clipboard semantics ([doc](https://47vigen.github.io/raqam/api/use-number-field/)).
- **`allowMouseWheel`:** opt-in wheel nudging (see docs).

## Locale plugins (built-in)

| Import | Scripts / notes |
|--------|------------------|
| `raqam/locales/fa` | Persian digits |
| `raqam/locales/ar` | Arabic-Indic digits |
| `raqam/locales/bn` | Bengali digits |
| `raqam/locales/hi` | Devanagari digits |
| `raqam/locales/th` | Thai digits |

Full table and `registerLocale` custom digits: [Locales & i18n](https://47vigen.github.io/raqam/guides/locales/).

## Server / core

`raqam/server` and `raqam/core` expose **`createFormatter`**, **`createParser`**, **`normalizeDigits`**, **`registerLocale`**, **`presets`**. Details: [Next.js guide](https://47vigen.github.io/raqam/guides/nextjs/) and package README.

## Types (TypeScript)

Export names like `UseNumberFieldStateOptions`, `NumberFieldState`, `UseNumberFieldProps`, `NumberFieldAria`, `ChangeReason` — see [Getting Started](https://47vigen.github.io/raqam/getting-started/) TypeScript section and published `.d.ts` on npm.
