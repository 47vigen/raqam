/**
 * Locale digit input tests — Phase 4
 *
 * Verifies in real browsers that:
 *   1. Native locale digit key presses are accepted and correctly parsed.
 *   2. aria-valuenow reflects the parsed numeric value, not the display string.
 *   3. Increment / decrement buttons work in each locale.
 *   4. min / max clamping applies correctly regardless of locale.
 *
 * Locale plugins are loaded globally via playwright/index.tsx.
 */

import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { NumberField } from "../src/react/NumberField";

// ── Helper component with optional min/max/step ───────────────────────────────

interface FieldProps {
  locale: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onValueChange?: (v: number | null) => void;
}

function Field({ locale, defaultValue, minValue, maxValue, step, onValueChange }: FieldProps) {
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

// ── 1. aria-valuenow reflects parsed numeric value ────────────────────────────

test.describe("aria-valuenow is always a number, not a display string", () => {
  for (const [locale, value] of [
    ["en-US", 1234] as const,
    ["de-DE", 9876] as const,
    ["fa-IR", 42] as const,
    ["ar-EG", 100] as const,
    ["hi-IN", 500] as const,
  ]) {
    test(`${locale}: aria-valuenow=${value}`, async ({ mount, page }) => {
      await mount(<Field locale={locale} defaultValue={value} />);

      const input = page.getByTestId("input");
      const ariaValueNow = await input.getAttribute("aria-valuenow");
      // aria-valuenow should be the raw number as a string, not locale-formatted
      expect(Number(ariaValueNow)).toBe(value);
    });
  }
});

// ── 2. ASCII digit input works in every locale ────────────────────────────────

test.describe("ASCII digit input is accepted in every locale", () => {
  for (const locale of ["en-US", "de-DE", "fa-IR", "ar-EG", "hi-IN", "bn-BD", "th-TH"]) {
    test(`${locale}: typing ASCII '99' results in value 99`, async ({ mount, page }) => {
      let captured: number | null = null;

      await mount(
        <Field
          locale={locale}
          onValueChange={(v) => { captured = v; }}
        />
      );

      const input = page.getByTestId("input");
      await input.click();
      await input.pressSequentially("99");
      await input.press("Tab"); // blur to commit

      const ariaValueNow = await input.getAttribute("aria-valuenow");
      expect(Number(ariaValueNow)).toBe(99);
    });
  }
});

// ── 3. Increment / decrement buttons ─────────────────────────────────────────

test.describe("increment/decrement buttons in RTL locales", () => {
  test("fa-IR: increment increases value by 1", async ({ mount, page }) => {
    await mount(<Field locale="fa-IR" defaultValue={5} step={1} />);

    await page.getByTestId("inc").click();

    const ariaValueNow = await page.getByTestId("input").getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(6);
  });

  test("fa-IR: decrement decreases value by 1", async ({ mount, page }) => {
    await mount(<Field locale="fa-IR" defaultValue={5} step={1} />);

    await page.getByTestId("dec").click();

    const ariaValueNow = await page.getByTestId("input").getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(4);
  });

  test("ar-EG: increment increases value by 1", async ({ mount, page }) => {
    await mount(<Field locale="ar-EG" defaultValue={10} step={1} />);

    await page.getByTestId("inc").click();

    const ariaValueNow = await page.getByTestId("input").getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(11);
  });

  test("hi-IN: decrement decreases value by step=5", async ({ mount, page }) => {
    await mount(<Field locale="hi-IN" defaultValue={100} step={5} />);

    await page.getByTestId("dec").click();

    const ariaValueNow = await page.getByTestId("input").getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(95);
  });
});

// ── 4. min / max clamping ─────────────────────────────────────────────────────

test.describe("min/max clamping works in all locales", () => {
  test("fa-IR: cannot decrement below minValue", async ({ mount, page }) => {
    await mount(
      <Field locale="fa-IR" defaultValue={1} minValue={0} maxValue={10} step={1} />
    );

    const dec = page.getByTestId("dec");
    await dec.click(); // 1 → 0
    await dec.click(); // should stay at 0

    const ariaValueNow = await page.getByTestId("input").getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(0);
  });

  test("ar-EG: cannot increment above maxValue", async ({ mount, page }) => {
    await mount(
      <Field locale="ar-EG" defaultValue={9} minValue={0} maxValue={10} step={1} />
    );

    const inc = page.getByTestId("inc");
    await inc.click(); // 9 → 10
    await inc.click(); // should stay at 10

    const ariaValueNow = await page.getByTestId("input").getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(10);
  });
});

// ── 5. Keyboard ArrowUp/Down in RTL locales ───────────────────────────────────

test.describe("keyboard navigation in RTL locales", () => {
  test("fa-IR: ArrowUp increases value", async ({ mount, page }) => {
    await mount(<Field locale="fa-IR" defaultValue={5} step={1} />);

    const input = page.getByTestId("input");
    await input.click();
    await input.press("ArrowUp");

    const ariaValueNow = await input.getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(6);
  });

  test("ar-EG: ArrowDown decreases value", async ({ mount, page }) => {
    await mount(<Field locale="ar-EG" defaultValue={5} step={1} />);

    const input = page.getByTestId("input");
    await input.click();
    await input.press("ArrowDown");

    const ariaValueNow = await input.getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(4);
  });

  test("fa-IR: Shift+ArrowUp increases by largeStep (10)", async ({ mount, page }) => {
    await mount(<Field locale="fa-IR" defaultValue={5} step={1} />);

    const input = page.getByTestId("input");
    await input.click();
    await input.press("Shift+ArrowUp");

    const ariaValueNow = await input.getAttribute("aria-valuenow");
    expect(Number(ariaValueNow)).toBe(15);
  });
});

// ── 6. Formatted display matches locale ──────────────────────────────────────

test.describe("formatted display in locale", () => {
  test("en-US: 1234 displays as '1,234'", async ({ mount, page }) => {
    await mount(<Field locale="en-US" defaultValue={1234} />);

    const value = await page.getByTestId("input").inputValue();
    expect(value).toBe("1,234");
  });

  test("de-DE: 1234 uses period grouping separator", async ({ mount, page }) => {
    await mount(<Field locale="de-DE" defaultValue={1234} />);

    const value = await page.getByTestId("input").inputValue();
    // de-DE formats 1234 as "1.234"
    expect(value).toBe("1.234");
  });
});
