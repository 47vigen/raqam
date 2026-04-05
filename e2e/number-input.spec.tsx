/**
 * Number input interaction E2E tests — Playwright CT
 *
 * Tests real-browser behavior for:
 *   - defaultValue uncontrolled initialization
 *   - Decimal input (23.58)
 *   - Negative number input (-23.58)
 *   - Compact notation display (1.5K)
 *   - Reset (clear) then retype
 *   - Keyboard interactions (ArrowUp/Down, blur commit)
 *
 * Run on CI: pnpm test:e2e
 *
 * Notes:
 * - Paste behavior is tested in NumberField.interactions.test.tsx (RTL)
 * - All assertions use Playwright's auto-retrying locator assertions
 *   (expect(locator).toHaveValue / toHaveAttribute) to tolerate React's
 *   async state updates, which can be slightly slower in Firefox than
 *   Chromium/WebKit.
 * - Compact notation text assertions use regex to tolerate Unicode
 *   spacing differences between browser ICU versions (e.g. narrow no-break
 *   space in some Firefox builds).
 */

import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { NumberInputField } from "./components/number-input-field";

// ── defaultValue — uncontrolled initialization ────────────────────────────────

test.describe("defaultValue — uncontrolled initialization", () => {
  test("shows formatted integer on mount", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={23456} />);
    const input = component.getByTestId("input");
    await expect(input).toHaveValue("23,456");
    await expect(input).toHaveAttribute("aria-valuenow", "23456");
  });

  test("shows formatted decimal on mount", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={23.58} />);
    const input = component.getByTestId("input");
    await expect(input).toHaveValue("23.58");
    await expect(input).toHaveAttribute("aria-valuenow", "23.58");
  });

  test("shows formatted negative on mount", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={-5} />);
    const input = component.getByTestId("input");
    await expect(input).toHaveValue("-5");
    await expect(input).toHaveAttribute("aria-valuenow", "-5");
  });

  test("shows compact notation on mount", async ({ mount }) => {
    const component = await mount(
      <NumberInputField
        defaultValue={1500}
        formatOptions={{ notation: "compact" }}
      />
    );
    const input = component.getByTestId("input");
    // Use regex to tolerate Unicode space variants across browser ICU versions
    // (e.g. Firefox may emit "1.5\u202fK")
    await expect(input).toHaveValue(/1[.,]?5\s*K/i);
    await expect(input).toHaveAttribute("aria-valuenow", "1500");
  });

  test("shows empty when no defaultValue", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await expect(input).toHaveValue("");
    await expect(input).not.toHaveAttribute("aria-valuenow");
  });
});

// ── Typing decimals ───────────────────────────────────────────────────────────

test.describe("Typing decimals", () => {
  test("types 23.58 into empty field", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.58", { delay: 50 });
    await expect(input).toHaveValue("23.58");
    await expect(input).toHaveAttribute("aria-valuenow", "23.58");
  });

  test("preserves intermediate '23.' without reformatting", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.", { delay: 50 });
    await expect(input).toHaveValue("23.");
    // Intermediate — no valuenow
    await expect(input).not.toHaveAttribute("aria-valuenow");
  });

  test("blur on intermediate '23.' clears the field", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.", { delay: 50 });
    // Use el.blur() directly — press("Tab") is unreliable in Firefox CT when
    // the next focusable element (e.g. a disabled button) is not in tab order,
    // causing focus to escape the iframe without firing the blur event.
    await input.evaluate((el) => (el as HTMLInputElement).blur());
    await expect(input).toHaveValue("");
    await expect(input).not.toHaveAttribute("aria-valuenow");
  });

  test("types decimal on field containing a value", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={100} />);
    const input = component.getByTestId("input");
    // Use fill() to reliably clear+replace across all browsers
    await input.fill("");
    await input.pressSequentially("99.99", { delay: 50 });
    await expect(input).toHaveAttribute("aria-valuenow", "99.99");
  });
});

// ── Typing negative numbers ───────────────────────────────────────────────────

test.describe("Typing negative numbers", () => {
  test("lone '-' stays intermediate — no aria-valuenow", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("-", { delay: 50 });
    await expect(input).not.toHaveAttribute("aria-valuenow");
  });

  test("types -5", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("-5", { delay: 50 });
    await expect(input).toHaveValue("-5");
    await expect(input).toHaveAttribute("aria-valuenow", "-5");
  });

  test("types -23.58", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("-23.58", { delay: 50 });
    await expect(input).toHaveValue("-23.58");
    await expect(input).toHaveAttribute("aria-valuenow", "-23.58");
  });

  test("replaces positive value with negative", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={100} />);
    const input = component.getByTestId("input");
    await input.fill("");
    await input.pressSequentially("-5", { delay: 50 });
    await expect(input).toHaveAttribute("aria-valuenow", "-5");
  });
});

// ── Compact notation ──────────────────────────────────────────────────────────

test.describe("Compact notation", () => {
  test("displays 1500 in K notation", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={1500} formatOptions={{ notation: "compact" }} />
    );
    const input = component.getByTestId("input");
    await expect(input).toHaveValue(/K/i);
    await expect(input).toHaveAttribute("aria-valuenow", "1500");
  });

  test("displays 1_200_000 in M notation", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={1_200_000} formatOptions={{ notation: "compact" }} />
    );
    const input = component.getByTestId("input");
    await expect(input).toHaveValue(/M/i);
    await expect(input).toHaveAttribute("aria-valuenow", "1200000");
  });

  test("increment button updates value", async ({ mount }) => {
    const component = await mount(
      <NumberInputField
        defaultValue={1500}
        step={500}
        formatOptions={{ notation: "compact" }}
      />
    );
    const increment = component.getByTestId("increment");
    await increment.click();
    const input = component.getByTestId("input");
    await expect(input).toHaveAttribute("aria-valuenow", "2000");
    await expect(input).toHaveValue(/K/i);
  });

  test("decrement button updates value", async ({ mount }) => {
    const component = await mount(
      <NumberInputField
        defaultValue={2000}
        step={500}
        formatOptions={{ notation: "compact" }}
      />
    );
    const decrement = component.getByTestId("decrement");
    await decrement.click();
    const input = component.getByTestId("input");
    await expect(input).toHaveAttribute("aria-valuenow", "1500");
    await expect(input).toHaveValue(/K/i);
  });
});

// ── Reset field then retype ───────────────────────────────────────────────────

test.describe("Reset field then retype", () => {
  test("clears field and leaves it empty", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.fill("");
    await expect(input).toHaveValue("");
    await expect(input).not.toHaveAttribute("aria-valuenow");
  });

  test("clears then types integer 100", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.fill("");
    await input.pressSequentially("100", { delay: 50 });
    await expect(input).toHaveAttribute("aria-valuenow", "100");
  });

  test("clears then types decimal 23.58", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.fill("");
    await input.pressSequentially("23.58", { delay: 50 });
    await expect(input).toHaveValue("23.58");
    await expect(input).toHaveAttribute("aria-valuenow", "23.58");
  });

  test("clears then types negative -5", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.fill("");
    await input.pressSequentially("-5", { delay: 50 });
    await expect(input).toHaveAttribute("aria-valuenow", "-5");
  });
});

// ── Keyboard interactions ─────────────────────────────────────────────────────

test.describe("Keyboard interactions", () => {
  test("ArrowUp increments by step", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={10} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.press("ArrowUp");
    await expect(input).toHaveAttribute("aria-valuenow", "11");
  });

  test("ArrowDown decrements by step", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={10} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-valuenow", "9");
  });

  test("Shift+ArrowUp increments by largeStep", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={0} step={1} largeStep={10} />
    );
    const input = component.getByTestId("input");
    await input.click();
    await input.press("Shift+ArrowUp");
    await expect(input).toHaveAttribute("aria-valuenow", "10");
  });

  test("Shift+ArrowDown decrements by largeStep", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={100} step={1} largeStep={10} />
    );
    const input = component.getByTestId("input");
    await input.click();
    await input.press("Shift+ArrowDown");
    await expect(input).toHaveAttribute("aria-valuenow", "90");
  });

  test("blur reformats intermediate '23.' to empty", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.", { delay: 50 });
    await input.evaluate((el) => (el as HTMLInputElement).blur());
    await expect(input).toHaveValue("");
    await expect(input).not.toHaveAttribute("aria-valuenow");
  });

  test("blur reformats valid number with grouping", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("1234", { delay: 50 });
    await input.evaluate((el) => (el as HTMLInputElement).blur());
    await expect(input).toHaveValue("1,234");
  });
});

// Paste behavior is tested in NumberField.interactions.test.tsx (RTL/userEvent).
// Cross-browser paste event dispatch in CT requires browser-specific workarounds.
