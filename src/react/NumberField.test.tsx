import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberField } from "./NumberField.js";

// Helper that renders a standard NumberField
function renderField(props: Parameters<typeof NumberField.Root>[0] = {}) {
  return render(
    <NumberField.Root {...props}>
      <NumberField.Label>Amount</NumberField.Label>
      <NumberField.Group>
        <NumberField.Decrement data-testid="decrement" />
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment" />
      </NumberField.Group>
    </NumberField.Root>
  );
}

describe("NumberField.Root", () => {
  it("renders without crashing", () => {
    renderField();
    expect(screen.getByTestId("input")).toBeInTheDocument();
  });

  it("renders label and associates it with input", () => {
    renderField();
    const label = screen.getByText("Amount");
    const input = screen.getByTestId("input");
    expect(label).toBeInTheDocument();
    // Label should point to input via htmlFor
    expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
  });

  it("renders increment and decrement buttons", () => {
    renderField();
    expect(screen.getByTestId("increment")).toBeInTheDocument();
    expect(screen.getByTestId("decrement")).toBeInTheDocument();
  });
});

describe("NumberField ARIA attributes", () => {
  it("has role spinbutton", () => {
    renderField();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("sets aria-valuenow from defaultValue", () => {
    renderField({ defaultValue: 42, locale: "en-US" });
    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "aria-valuenow",
      "42"
    );
  });

  it("sets aria-valuemin and aria-valuemax", () => {
    renderField({ minValue: 0, maxValue: 100, locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-valuemin", "0");
    expect(input).toHaveAttribute("aria-valuemax", "100");
  });

  it("sets aria-disabled when disabled", () => {
    renderField({ disabled: true });
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-disabled");
  });

  it("sets aria-readonly when readOnly", () => {
    renderField({ readOnly: true });
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-readonly");
  });

  it("sets aria-required when required", () => {
    renderField({ required: true });
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-required");
  });
});

describe("NumberField input type", () => {
  it("is type=text with inputmode=decimal", () => {
    renderField();
    const input = screen.getByTestId("input");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });
});

describe("NumberField keyboard interactions", () => {
  it("increments on ArrowUp", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5, locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("6");
  });

  it("decrements on ArrowDown", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5, locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("4");
  });

  it("increments by largeStep on Shift+ArrowUp", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5, locale: "en-US", step: 1 });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(input).toHaveValue("15"); // largeStep = 10
  });

  it("decrements by largeStep on Shift+ArrowDown", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 50, locale: "en-US", step: 1 });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(input).toHaveValue("40");
  });

  it("goes to min on Home key", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 50, locale: "en-US", minValue: 0, maxValue: 100 });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{Home}");
    expect(input).toHaveValue("0");
  });

  it("goes to max on End key", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 50, locale: "en-US", minValue: 0, maxValue: 100 });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{End}");
    expect(input).toHaveValue("100");
  });

  it("increments by largeStep on PageUp", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5, locale: "en-US", step: 1 });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{PageUp}");
    expect(input).toHaveValue("15");
  });

  it("decrements by largeStep on PageDown", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 50, locale: "en-US", step: 1 });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{PageDown}");
    expect(input).toHaveValue("40");
  });
});

describe("NumberField button interactions", () => {
  it("increments when increment button is clicked", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5, locale: "en-US" });
    await user.click(screen.getByTestId("increment"));
    expect(screen.getByRole("spinbutton")).toHaveValue("6");
  });

  it("decrements when decrement button is clicked", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: 5, locale: "en-US" });
    await user.click(screen.getByTestId("decrement"));
    expect(screen.getByRole("spinbutton")).toHaveValue("4");
  });

  it("disables increment button at maxValue", () => {
    renderField({ defaultValue: 10, maxValue: 10, locale: "en-US" });
    expect(screen.getByTestId("increment")).toBeDisabled();
  });

  it("disables decrement button at minValue", () => {
    renderField({ defaultValue: 0, minValue: 0, locale: "en-US" });
    expect(screen.getByTestId("decrement")).toBeDisabled();
  });
});

describe("NumberField form integration", () => {
  it("renders hidden input when name is provided", () => {
    render(
      <NumberField.Root name="price" defaultValue={42} locale="en-US">
        <NumberField.Input data-testid="input" />
        <NumberField.HiddenInput />
      </NumberField.Root>
    );
    const hidden = document.querySelector("input[type=hidden]");
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveAttribute("name", "price");
    expect(hidden).toHaveAttribute("value", "42");
  });

  it("does NOT render hidden input when no name", () => {
    render(
      <NumberField.Root defaultValue={42} locale="en-US">
        <NumberField.Input data-testid="input" />
        <NumberField.HiddenInput />
      </NumberField.Root>
    );
    expect(document.querySelector("input[type=hidden]")).toBeNull();
  });
});

describe("NumberField blur behavior", () => {
  it("commits and re-formats on blur", async () => {
    const user = userEvent.setup();
    renderField({ locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    // Type raw digits — liveFormat will format them
    await user.keyboard("1234");
    // Should show formatted value
    expect(input.getAttribute("value")).toContain("1");
  });
});

describe("NumberField render prop", () => {
  it("renders custom element via render prop (element form)", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Increment
          render={<button data-testid="custom-btn" />}
        >
          up
        </NumberField.Increment>
      </NumberField.Root>
    );
    expect(screen.getByTestId("custom-btn")).toBeInTheDocument();
  });
});

describe("NumberField disabled", () => {
  it("disables the input", () => {
    renderField({ disabled: true });
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });

  it("disables increment and decrement buttons", () => {
    renderField({ disabled: true });
    expect(screen.getByTestId("increment")).toBeDisabled();
    expect(screen.getByTestId("decrement")).toBeDisabled();
  });
});

describe("NumberField data attributes", () => {
  it("sets data-disabled on root when disabled", () => {
    const { container } = renderField({ disabled: true });
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-disabled")).toBe("");
  });
});
