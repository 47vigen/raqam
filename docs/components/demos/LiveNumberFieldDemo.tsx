"use client"

import "raqam/locales/fa"
import { NumberField } from "raqam"
import { fieldButton, fieldDesc, fieldGroup, fieldInput, fieldLabel } from "@/components/field-styles"

export type LiveDemoVariant = "currency" | "quantity" | "persian"

const captions: Record<LiveDemoVariant, string> = {
  currency: "Type 1234 — live currency formatting, cursor-stable.",
  quantity: "Integer field with min 0 and steppers.",
  persian: "Type Persian digits — normalized and re-formatted for fa-IR.",
}

export function LiveNumberFieldDemo({
  variant,
  className = "",
  bare = false,
}: {
  variant: LiveDemoVariant
  className?: string
  /** Drop the framed card (border/bg/margin) — for embedding inside another panel. */
  bare?: boolean
}) {
  const rtl = variant === "persian"
  const shell = bare ? className : `my-5 border border-fd-border bg-fd-card p-4 ${className}`.trim()

  return (
    <div className={shell}>
      <div className={rtl ? "text-right [direction:rtl]" : ""}>
        {variant === "currency" && (
          <NumberField.Root
            locale="en-US"
            minValue={0}
            defaultValue={123456}
            formatOptions={{ style: "currency", currency: "USD" }}
          >
            <NumberField.Label className={fieldLabel}>Price</NumberField.Label>
            <NumberField.Group className={`mt-1.5 ${fieldGroup}`}>
              <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
              <NumberField.Input className={fieldInput} />
              <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
            </NumberField.Group>
            <NumberField.HiddenInput />
          </NumberField.Root>
        )}
        {variant === "quantity" && (
          <NumberField.Root locale="en-US" defaultValue={1} minValue={0}>
            <NumberField.Label className={fieldLabel}>Quantity</NumberField.Label>
            <NumberField.Group className={`mt-1.5 ${fieldGroup}`}>
              <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
              <NumberField.Input className={fieldInput} />
              <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
            </NumberField.Group>
          </NumberField.Root>
        )}
        {variant === "persian" && (
          <NumberField.Root locale="fa-IR" defaultValue={0}>
            <NumberField.Label className={fieldLabel}>مبلغ (fa-IR)</NumberField.Label>
            <NumberField.Group className={`mt-1.5 ${fieldGroup}`}>
              <NumberField.Decrement className={fieldButton}>−</NumberField.Decrement>
              <NumberField.Input className={fieldInput} dir="rtl" />
              <NumberField.Increment className={fieldButton}>+</NumberField.Increment>
            </NumberField.Group>
          </NumberField.Root>
        )}
        <p className={`mt-2 ${fieldDesc}`}>{captions[variant]}</p>
      </div>
    </div>
  )
}
