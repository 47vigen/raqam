import React from "react";
import { NumberField } from "../../src/react/NumberField";

export interface FieldProps {
  locale: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onValueChange?: (v: number | null) => void;
}

export function Field({ locale, defaultValue, minValue, maxValue, step, onValueChange }: FieldProps) {
  return (
    <NumberField.Root
      locale={locale}
      defaultValue={defaultValue}
      minValue={minValue}
      maxValue={maxValue}
      step={step ?? 1}
      onValueChange={onValueChange}
    >
      <NumberField.Decrement data-testid="dec">-</NumberField.Decrement>
      <NumberField.Input data-testid="input" />
      <NumberField.Increment data-testid="inc">+</NumberField.Increment>
    </NumberField.Root>
  );
}
