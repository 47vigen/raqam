import React from "react";
import { NumberField } from "../../src/react/NumberField";

export interface TestFieldProps {
  locale: string;
  defaultValue?: number;
  onValueChange?: (v: number | null) => void;
}

export function TestField({ locale, defaultValue, onValueChange }: TestFieldProps) {
  return (
    <NumberField.Root locale={locale} defaultValue={defaultValue} onValueChange={onValueChange}>
      <NumberField.Input data-testid="input" />
    </NumberField.Root>
  );
}
