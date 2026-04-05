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
 *   - Paste with currency stripping
 *
 * Run on CI: pnpm test:e2e
 */

import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { NumberInputField } from "./components/number-input-field";

// ── defaultValue — uncontrolled initialization ────────────────────────────────

test.describe("defaultValue — uncontrolled initialization", () => {
  test("shows formatted integer on mount", async ({ mount }) => {
    await mount(<NumberInputField defaultValue={23456} />);
    const input = await (await mount(<NumberInputField defaultValue={23456} />)).getByTestId("input");
    expect(await input.inputValue()).toBe("23,456");
    expect(await input.getAttribute("aria-valuenow")).toBe("23456");
  });

  test("shows formatted decimal on mount", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={23.58} />);
    const input = component.getByTestId("input");
    expect(await input.inputValue()).toBe("23.58");
    expect(await input.getAttribute("aria-valuenow")).toBe("23.58");
  });

  test("shows formatted negative on mount", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={-5} />);
    const input = component.getByTestId("input");
    expect(await input.inputValue()).toBe("-5");
    expect(await input.getAttribute("aria-valuenow")).toBe("-5");
  });

  test("shows compact notation on mount", async ({ mount }) => {
    const component = await mount(
      <NumberInputField
        defaultValue={1500}
        formatOptions={{ notation: "compact" }}
      />
    );
    const input = component.getByTestId("input");
    expect(await input.inputValue()).toBe("1.5K");
    expect(await input.getAttribute("aria-valuenow")).toBe("1500");
  });

  test("shows empty when no defaultValue", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    expect(await input.inputValue()).toBe("");
    expect(await input.getAttribute("aria-valuenow")).toBeNull();
  });
});

// ── Typing decimals ───────────────────────────────────────────────────────────

test.describe("Typing decimals", () => {
  test("types 23.58 into empty field", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.58");
    expect(await input.inputValue()).toBe("23.58");
    expect(await input.getAttribute("aria-valuenow")).toBe("23.58");
  });

  test("preserves intermediate '23.' without reformatting", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.");
    expect(await input.inputValue()).toBe("23.");
    // Intermediate — no valuenow
    expect(await input.getAttribute("aria-valuenow")).toBeNull();
  });

  test("blur on intermediate '23.' clears the field", async ({ mount, page }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.");
    await input.press("Tab"); // trigger blur
    expect(await input.inputValue()).toBe("");
    expect(await input.getAttribute("aria-valuenow")).toBeNull();
  });

  test("types decimal on field containing a value", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={100} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.selectText();
    await input.pressSequentially("99.99");
    expect(await input.getAttribute("aria-valuenow")).toBe("99.99");
  });
});

// ── Typing negative numbers ───────────────────────────────────────────────────

test.describe("Typing negative numbers", () => {
  test("lone '-' stays intermediate — no aria-valuenow", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("-");
    expect(await input.getAttribute("aria-valuenow")).toBeNull();
  });

  test("types -5", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("-5");
    expect(await input.inputValue()).toBe("-5");
    expect(await input.getAttribute("aria-valuenow")).toBe("-5");
  });

  test("types -23.58", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("-23.58");
    expect(await input.inputValue()).toBe("-23.58");
    expect(await input.getAttribute("aria-valuenow")).toBe("-23.58");
  });

  test("replaces positive value with negative", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={100} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.selectText();
    await input.pressSequentially("-5");
    expect(await input.getAttribute("aria-valuenow")).toBe("-5");
  });
});

// ── Compact notation ──────────────────────────────────────────────────────────

test.describe("Compact notation", () => {
  test("displays 1500 as 1.5K", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={1500} formatOptions={{ notation: "compact" }} />
    );
    const input = component.getByTestId("input");
    expect(await input.inputValue()).toBe("1.5K");
    expect(await input.getAttribute("aria-valuenow")).toBe("1500");
  });

  test("displays 1_200_000 as 1.2M", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={1_200_000} formatOptions={{ notation: "compact" }} />
    );
    const input = component.getByTestId("input");
    expect(await input.inputValue()).toBe("1.2M");
    expect(await input.getAttribute("aria-valuenow")).toBe("1200000");
  });

  test("increment button updates compact display", async ({ mount }) => {
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
    expect(await input.inputValue()).toBe("2K");
    expect(await input.getAttribute("aria-valuenow")).toBe("2000");
  });

  test("decrement button updates compact display", async ({ mount }) => {
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
    expect(await input.inputValue()).toBe("1.5K");
    expect(await input.getAttribute("aria-valuenow")).toBe("1500");
  });
});

// ── Reset field then retype ───────────────────────────────────────────────────

test.describe("Reset field then retype", () => {
  test("clears field and leaves it empty", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.selectText();
    await input.press("Backspace");
    expect(await input.inputValue()).toBe("");
    expect(await input.getAttribute("aria-valuenow")).toBeNull();
  });

  test("clears then types integer 100", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.selectText();
    await input.press("Backspace");
    await input.pressSequentially("100");
    expect(await input.getAttribute("aria-valuenow")).toBe("100");
  });

  test("clears then types decimal 23.58", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.selectText();
    await input.press("Backspace");
    await input.pressSequentially("23.58");
    expect(await input.inputValue()).toBe("23.58");
    expect(await input.getAttribute("aria-valuenow")).toBe("23.58");
  });

  test("clears then types negative -5", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={42} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.selectText();
    await input.press("Backspace");
    await input.pressSequentially("-5");
    expect(await input.getAttribute("aria-valuenow")).toBe("-5");
  });
});

// ── Keyboard interactions ─────────────────────────────────────────────────────

test.describe("Keyboard interactions", () => {
  test("ArrowUp increments by step", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={10} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.press("ArrowUp");
    expect(await input.getAttribute("aria-valuenow")).toBe("11");
  });

  test("ArrowDown decrements by step", async ({ mount }) => {
    const component = await mount(<NumberInputField defaultValue={10} />);
    const input = component.getByTestId("input");
    await input.click();
    await input.press("ArrowDown");
    expect(await input.getAttribute("aria-valuenow")).toBe("9");
  });

  test("Shift+ArrowUp increments by largeStep", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={0} step={1} largeStep={10} />
    );
    const input = component.getByTestId("input");
    await input.click();
    await input.press("Shift+ArrowUp");
    expect(await input.getAttribute("aria-valuenow")).toBe("10");
  });

  test("Shift+ArrowDown decrements by largeStep", async ({ mount }) => {
    const component = await mount(
      <NumberInputField defaultValue={100} step={1} largeStep={10} />
    );
    const input = component.getByTestId("input");
    await input.click();
    await input.press("Shift+ArrowDown");
    expect(await input.getAttribute("aria-valuenow")).toBe("90");
  });

  test("blur reformats intermediate '23.' to empty", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("23.");
    await input.press("Tab"); // blur
    expect(await input.inputValue()).toBe("");
    expect(await input.getAttribute("aria-valuenow")).toBeNull();
  });

  test("blur reformats valid number with grouping", async ({ mount }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await input.pressSequentially("1234");
    await input.press("Tab"); // blur triggers commit
    expect(await input.inputValue()).toBe("1,234");
  });
});

// ── Paste ─────────────────────────────────────────────────────────────────────

test.describe("Paste", () => {
  test("pastes plain number string", async ({ mount, page }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="input"]') as HTMLInputElement;
      const dt = new DataTransfer();
      dt.setData("text/plain", "1234.56");
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
    });
    expect(await input.getAttribute("aria-valuenow")).toBe("1234.56");
  });

  test("strips currency symbol when pasting", async ({ mount, page }) => {
    const component = await mount(<NumberInputField />);
    const input = component.getByTestId("input");
    await input.click();
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="input"]') as HTMLInputElement;
      const dt = new DataTransfer();
      dt.setData("text/plain", "$1,234.56");
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
    });
    expect(await input.getAttribute("aria-valuenow")).toBe("1234.56");
  });
});
