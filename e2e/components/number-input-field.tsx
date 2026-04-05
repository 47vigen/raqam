import React from "react";
import { NumberField } from "../../src/react/NumberField";

export interface NumberInputFieldProps {
  locale?: string;
  defaultValue?: number;
  value?: number | null;
  minValue?: number;
  maxValue?: number;
  step?: number;
  largeStep?: number;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  onChange?: (v: number | null) => void;
  onValueChange?: (v: number | null) => void;
}

export function NumberInputField({
  locale = "en-US",
  defaultValue,
  value,
  minValue,
  maxValue,
  step = 1,
  largeStep,
  allowNegative,
  allowDecimal,
  formatOptions,
  onChange,
  onValueChange,
}: NumberInputFieldProps) {
  return (
    <NumberField.Root
      locale={locale}
      defaultValue={defaultValue}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      largeStep={largeStep}
      allowNegative={allowNegative}
      allowDecimal={allowDecimal}
      formatOptions={formatOptions}
      onChange={onChange}
      onValueChange={onValueChange}
    >
      <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      <NumberField.Input data-testid="input" />
      <NumberField.Increment data-testid="increment">+</NumberField.Increment>
    </NumberField.Root>
  );
}
