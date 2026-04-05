import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberField } from "./NumberField.js";

// ── Helper ─────────────────────────────────────────────────────────────────────

function renderField(props: Parameters<typeof NumberField.Root>[0] = {}) {
  return render(
    <NumberField.Root locale="en-US" {...props}>
      <NumberField.Label>Amount</NumberField.Label>
      <NumberField.Group>
        <NumberField.Decrement data-testid="decrement" />
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment" />
      </NumberField.Group>
    </NumberField.Root>
  );
}

function getInput() {
  return screen.getByTestId("input") as HTMLInputElement;
}

// ── defaultValue — uncontrolled component ─────────────────────────────────────

describe("defaultValue — uncontrolled component", () => {
  it("shows formatted integer on mount", () => {
    renderField({ defaultValue: 23456 });
    expect(getInput().value).toBe("23,456");
  });

  it("shows formatted decimal on mount", () => {
    renderField({ defaultValue: 23.58 });
    expect(getInput().value).toBe("23.58");
  });

  it("shows formatted negative on mount", () => {
    renderField({ defaultValue: -5 });
    expect(getInput().value).toBe("-5");
  });

  it("shows compact notation on mount", () => {
    renderField({
      defaultValue: 1500,
      formatOptions: { notation: "compact" },
    });
    expect(getInput().value).toBe("1.5K");
  });

  it("shows empty string when no defaultValue", () => {
    renderField();
    expect(getInput().value).toBe("");
  });
});

// ── Typing decimals ───────────────────────────────────────────────────────────

describe("Typing decimals", () => {
  it("types 23.58 into an empty field", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "23.58");
    expect(getInput().value).toBe("23.58");
    expect(getInput()).toHaveAttribute("aria-valuenow", "23.58");
  });

  it("preserves intermediate '23.' while typing", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "23.");
    expect(getInput().value).toBe("23.");
    // No valuenow yet — intermediate state
    expect(getInput()).not.toHaveAttribute("aria-valuenow");
  });

  it("completes decimal after intermediate", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "23.58");
    expect(getInput().value).toBe("23.58");
    expect(getInput()).toHaveAttribute("aria-valuenow", "23.58");
  });

  it("blur on intermediate '23.' clears the field (numberValue is null)", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "23.");
    await user.tab(); // trigger blur — intermediate with null numberValue → cleared
    expect(getInput().value).toBe("");
    expect(getInput()).not.toHaveAttribute("aria-valuenow");
  });

  it("replaces existing value with decimal", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 100 });
    const input = getInput();
    await user.clear(input);
    await user.type(input, "99.99");
    expect(input.value).toBe("99.99");
    expect(input).toHaveAttribute("aria-valuenow", "99.99");
  });
});

// ── Typing negative numbers ───────────────────────────────────────────────────

describe("Typing negative numbers", () => {
  it("lone '-' keeps field intermediate — no aria-valuenow", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "-");
    expect(getInput()).not.toHaveAttribute("aria-valuenow");
  });

  it("types -5", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "-5");
    expect(getInput().value).toBe("-5");
    expect(getInput()).toHaveAttribute("aria-valuenow", "-5");
  });

  it("types -23.58", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "-23.58");
    expect(getInput().value).toBe("-23.58");
    expect(getInput()).toHaveAttribute("aria-valuenow", "-23.58");
  });

  it("replaces positive value with negative", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 100 });
    const input = getInput();
    await user.clear(input);
    await user.type(input, "-5");
    expect(input).toHaveAttribute("aria-valuenow", "-5");
  });

  it("allowNegative:false ignores minus key", async () => {
    const user = userEvent.setup();
    renderField({ allowNegative: false });
    await user.click(getInput());
    await user.type(getInput(), "-5");
    expect(getInput()).not.toHaveAttribute("aria-valuenow");
    // The input should not contain a negative value
    const value = Number(getInput().getAttribute("aria-valuenow"));
    expect(value).not.toBeLessThan(0);
  });
});

// ── Compact notation ──────────────────────────────────────────────────────────

describe("Compact notation", () => {
  it("displays 1500 as 1.5K", () => {
    renderField({
      defaultValue: 1500,
      formatOptions: { notation: "compact" },
    });
    expect(getInput().value).toBe("1.5K");
  });

  it("displays 1_200_000 as 1.2M", () => {
    renderField({
      defaultValue: 1_200_000,
      formatOptions: { notation: "compact" },
    });
    expect(getInput().value).toBe("1.2M");
  });

  it("increment button updates compact display", async () => {
    const user = userEvent.setup();
    renderField({
      defaultValue: 1500,
      step: 500,
      formatOptions: { notation: "compact" },
    });
    await user.click(screen.getByTestId("increment"));
    expect(getInput().value).toBe("2K");
  });

  it("decrement button updates compact display", async () => {
    const user = userEvent.setup();
    renderField({
      defaultValue: 2000,
      step: 500,
      formatOptions: { notation: "compact" },
    });
    await user.click(screen.getByTestId("decrement"));
    expect(getInput().value).toBe("1.5K");
  });
});

// ── Keyboard interactions ─────────────────────────────────────────────────────

describe("Keyboard interactions", () => {
  it("ArrowUp increments by step", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 10 });
    await user.click(getInput());
    await user.keyboard("{ArrowUp}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "11");
  });

  it("ArrowDown decrements by step", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 10 });
    await user.click(getInput());
    await user.keyboard("{ArrowDown}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "9");
  });

  it("Shift+ArrowUp increments by largeStep", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 0, step: 1, largeStep: 10 });
    await user.click(getInput());
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "10");
  });

  it("Shift+ArrowDown decrements by largeStep", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 100, step: 1, largeStep: 10 });
    await user.click(getInput());
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "90");
  });

  it("PageUp increments by largeStep", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 0, step: 1, largeStep: 10 });
    await user.click(getInput());
    await user.keyboard("{PageUp}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "10");
  });

  it("PageDown decrements by largeStep", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 100, step: 1, largeStep: 10 });
    await user.click(getInput());
    await user.keyboard("{PageDown}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "90");
  });

  it("Home jumps to minValue", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 50, minValue: 0, maxValue: 100 });
    await user.click(getInput());
    await user.keyboard("{Home}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "0");
  });

  it("End jumps to maxValue", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 50, minValue: 0, maxValue: 100 });
    await user.click(getInput());
    await user.keyboard("{End}");
    expect(getInput()).toHaveAttribute("aria-valuenow", "100");
  });

  it("Enter commits and reformats", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    // Use paste to avoid cursor issues with live formatting during char-by-char typing
    await user.paste("1234.5");
    await user.keyboard("{Enter}");
    expect(getInput().value).toBe("1,234.5");
  });

  it("Tab triggers blur which reformats", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.type(getInput(), "1234");
    await user.tab();
    expect(getInput().value).toBe("1,234");
  });
});

// ── Button interactions ───────────────────────────────────────────────────────

describe("Button interactions", () => {
  it("click Increment increases value", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5 });
    await user.click(screen.getByTestId("increment"));
    expect(getInput()).toHaveAttribute("aria-valuenow", "6");
  });

  it("click Decrement decreases value", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5 });
    await user.click(screen.getByTestId("decrement"));
    expect(getInput()).toHaveAttribute("aria-valuenow", "4");
  });

  it("Increment button is disabled at maxValue", () => {
    renderField({ defaultValue: 10, maxValue: 10 });
    expect(screen.getByTestId("increment")).toBeDisabled();
  });

  it("Decrement button is disabled at minValue", () => {
    renderField({ defaultValue: 0, minValue: 0 });
    expect(screen.getByTestId("decrement")).toBeDisabled();
  });

  it("fires onChange when increment is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ defaultValue: 5, onChange });
    await user.click(screen.getByTestId("increment"));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("fires onChange when decrement is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ defaultValue: 5, onChange });
    await user.click(screen.getByTestId("decrement"));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

// ── Paste ─────────────────────────────────────────────────────────────────────

describe("Paste", () => {
  it("pastes a plain number string", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.paste("1234.56");
    expect(getInput()).toHaveAttribute("aria-valuenow", "1234.56");
  });

  it("strips currency symbol when pasting", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.paste("$1,234.56");
    expect(getInput()).toHaveAttribute("aria-valuenow", "1234.56");
  });

  it("does not paste non-numeric garbage", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(getInput());
    await user.paste("abcxyz");
    // Field should remain empty / unchanged
    expect(getInput().value).toBe("");
    expect(getInput()).not.toHaveAttribute("aria-valuenow");
  });
});

// ── Reset field then retype ───────────────────────────────────────────────────

describe("Reset field then retype", () => {
  it("clears field and leaves it empty", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.tripleClick(input);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("");
    expect(input).not.toHaveAttribute("aria-valuenow");
  });

  it("clears then types integer 100", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.tripleClick(input);
    await user.keyboard("{Backspace}");
    await user.type(input, "100");
    expect(input).toHaveAttribute("aria-valuenow", "100");
  });

  it("clears then types decimal 23.58", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.tripleClick(input);
    await user.keyboard("{Backspace}");
    await user.type(input, "23.58");
    expect(input.value).toBe("23.58");
    expect(input).toHaveAttribute("aria-valuenow", "23.58");
  });

  it("clears then types negative", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.tripleClick(input);
    await user.keyboard("{Backspace}");
    await user.type(input, "-5");
    expect(input).toHaveAttribute("aria-valuenow", "-5");
  });
});

// ── Update field containing a value ──────────────────────────────────────────

describe("Update field containing a value", () => {
  it("clear and type new integer", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.clear(input);
    await user.type(input, "99");
    expect(input).toHaveAttribute("aria-valuenow", "99");
  });

  it("clear and type new decimal", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.clear(input);
    await user.type(input, "10.5");
    expect(input.value).toBe("10.5");
    expect(input).toHaveAttribute("aria-valuenow", "10.5");
  });

  it("clear then type new value with keyboard Delete", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 42 });
    const input = getInput();
    await user.click(input);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("{Delete}");
    await user.type(input, "10.5");
    expect(input.value).toBe("10.5");
    expect(input).toHaveAttribute("aria-valuenow", "10.5");
  });

  it("fires onChange with new value after clearing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ defaultValue: 42, onChange });
    const input = getInput();
    await user.clear(input);
    await user.type(input, "99");
    expect(onChange).toHaveBeenCalledWith(99);
  });
});
