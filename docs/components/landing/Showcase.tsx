"use client"

import "raqam/locales/fa"
import { NumberField, presets } from "raqam"
import {
  fieldButton,
  fieldDesc,
  fieldGroup,
  fieldInput,
  fieldLabel,
} from "@/components/field-styles"

type FieldId = "currency" | "percent" | "scrub" | "accounting" | "unit" | "persian"

const HERO_FIELDS: FieldId[] = ["currency", "percent", "persian"]
const ALL_FIELDS: FieldId[] = [
  "currency",
  "percent",
  "scrub",
  "accounting",
  "unit",
  "persian",
]

function Field({
  rtl = false,
  children,
}: {
  rtl?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${rtl ? "text-right [direction:rtl]" : ""}`}>
      {children}
    </div>
  )
}

function Currency() {
  return (
    <Field>
      <NumberField.Root
        locale="en-US"
        formatOptions={presets.currency("USD")}
        defaultValue={129}
        minValue={0}
        step={1}
      >
        <NumberField.Label className={fieldLabel}>Subtotal</NumberField.Label>
        <NumberField.Description className={fieldDesc}>
          Live currency · steppers · keyboard nudging
        </NumberField.Description>
        <NumberField.Group className={fieldGroup}>
          <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
          <NumberField.Input className={fieldInput} />
          <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
        </NumberField.Group>
        <NumberField.HiddenInput />
      </NumberField.Root>
    </Field>
  )
}

function Percent() {
  return (
    <Field>
      <NumberField.Root
        locale="en-US"
        formatOptions={{
          ...presets.percent,
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        }}
        defaultValue={0.0825}
        minValue={0}
        maxValue={1}
        step={0.01}
      >
        <NumberField.Label className={fieldLabel}>Tax rate</NumberField.Label>
        <NumberField.Description className={fieldDesc}>
          Percent style, stored 0–1 · step ±1 pt
        </NumberField.Description>
        <NumberField.Group className={fieldGroup}>
          <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
          <NumberField.Input className={fieldInput} />
          <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </Field>
  )
}

function Scrub() {
  return (
    <Field>
      <NumberField.Root locale="en-US" defaultValue={78} minValue={0} maxValue={100} step={1}>
        <NumberField.ScrubArea
          direction="horizontal"
          pixelSensitivity={2}
          className="w-fit cursor-ew-resize select-none"
        >
          <NumberField.Label className={`cursor-ew-resize ${fieldLabel}`}>
            Opacity ↔
          </NumberField.Label>
        </NumberField.ScrubArea>
        <NumberField.Description className={fieldDesc}>
          Drag the label to scrub · 0–100
        </NumberField.Description>
        <NumberField.Group className={fieldGroup}>
          <NumberField.Input className={fieldInput} />
        </NumberField.Group>
      </NumberField.Root>
    </Field>
  )
}

function Accounting() {
  return (
    <Field>
      <NumberField.Root
        locale="en-US"
        formatOptions={presets.accounting("USD")}
        defaultValue={-2400}
        allowNegative
      >
        <NumberField.Label className={fieldLabel}>Ledger</NumberField.Label>
        <NumberField.Description className={fieldDesc}>
          Accounting sign · negatives in parentheses
        </NumberField.Description>
        <NumberField.Group className={fieldGroup}>
          <NumberField.Input className={fieldInput} />
        </NumberField.Group>
      </NumberField.Root>
    </Field>
  )
}

function Unit() {
  return (
    <Field>
      <NumberField.Root
        locale="en-US"
        formatOptions={presets.unit("kilometer")}
        defaultValue={42.5}
        minValue={0}
        step={0.1}
      >
        <NumberField.Label className={fieldLabel}>Distance</NumberField.Label>
        <NumberField.Description className={fieldDesc}>
          Unit style · kilometer · step 0.1 km
        </NumberField.Description>
        <NumberField.Group className={fieldGroup}>
          <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
          <NumberField.Input className={fieldInput} />
          <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </Field>
  )
}

function Persian() {
  return (
    <Field rtl>
      <NumberField.Root locale="fa-IR" defaultValue={1250000} minValue={0} step={1000}>
        <NumberField.Label className={fieldLabel}>مبلغ فاکتور (fa-IR)</NumberField.Label>
        <NumberField.Description className={fieldDesc}>
          ارقام فارسی + افزونهٔ locale · راست‌به‌چپ
        </NumberField.Description>
        <NumberField.Group className={fieldGroup}>
          <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
          <NumberField.Input className={fieldInput} dir="rtl" />
          <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </Field>
  )
}

const RENDERERS: Record<FieldId, () => React.JSX.Element> = {
  currency: Currency,
  percent: Percent,
  scrub: Scrub,
  accounting: Accounting,
  unit: Unit,
  persian: Persian,
}

export function Showcase({ variant = "all" }: { variant?: "hero" | "all" }) {
  if (variant === "hero") {
    return (
      <div className="border border-l-2 border-fd-border border-l-fd-primary bg-fd-card p-5 md:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-fd-muted-foreground">
          <span>Live · try it</span>
          <span>type to format</span>
        </div>
        <div className="flex flex-col gap-4">
          {HERO_FIELDS.map((id) => {
            const C = RENDERERS[id]
            return <C key={id} />
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4">
      {ALL_FIELDS.map((id) => {
        const C = RENDERERS[id]
        return <C key={id} />
      })}
    </div>
  )
}
