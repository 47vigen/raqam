import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NumberField } from "../NumberField.js";
import { renderField, norm } from "../../test-utils.js";

/**
 * Accessibility edge cases for the spinbutton surface.
 *
 * The input must always present a coherent assistive-tech contract: role,
 * inputMode, and the aria-value* trio that lets a screen reader announce the
 * field's current/min/max and a human-readable formatted value. Invalid states
 * (out-of-range or a failing `validate`) must flip aria-invalid and wire up the
 * error message. Non-finite defaults (NaN/Infinity) must degrade to an empty,
 * value-less field rather than leaking "NaN" into ARIA or a hidden form input.
 *
 * We drive the real component (renderField for the wired-up cases; a hand-built
 * tree only where we need NumberField.ErrorMessage, which the shared harness
 * does not mount). Currency aria-valuetext contains NBSP, so wrap in norm().
 */

describe("a11y edge — spinbutton role & input mode", () => {
  it("input advertises role=spinbutton with decimal input mode", () => {
    const h = renderField({ defaultValue: 5 });
    expect(h.input).toHaveAttribute("role", "spinbutton");
    expect(h.input).toHaveAttribute("inputmode", "decimal");
  });
});

describe("a11y edge — aria-value trio mirrors the numeric model", () => {
  it("aria-valuenow equals the current numeric value", () => {
    const h = renderField({ defaultValue: 1234 });
    expect(h.ariaValueNow()).toBe("1234");
    expect(h.value()).toBe(1234);
  });

  it("aria-valuemin and aria-valuemax equal minValue and maxValue when set", () => {
    const h = renderField({ defaultValue: 5, minValue: -10, maxValue: 100 });
    expect(h.input).toHaveAttribute("aria-valuemin", "-10");
    expect(h.input).toHaveAttribute("aria-valuemax", "100");
  });

  it("aria-valuemin and aria-valuemax are absent when no bounds are given", () => {
    const h = renderField({ defaultValue: 5 });
    expect(h.input).not.toHaveAttribute("aria-valuemin");
    expect(h.input).not.toHaveAttribute("aria-valuemax");
  });

  it("aria-valuetext equals the formatted currency display", () => {
    const h = renderField({
      defaultValue: 1234.56,
      formatOptions: { style: "currency", currency: "USD" },
    });
    expect(norm(h.input.getAttribute("aria-valuetext") ?? "")).toBe("$1,234.56");
    expect(norm(h.display())).toBe("$1,234.56");
    expect(h.value()).toBe(1234.56);
  });

  it("aria-valuetext tracks a typed value through to commit", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "2500");
    await h.user.tab();
    expect(norm(h.input.getAttribute("aria-valuetext") ?? "")).toBe("2,500");
    expect(h.value()).toBe(2500);
  });

  it("no value -> no aria-valuenow and no aria-valuetext", () => {
    const h = renderField({});
    expect(h.ariaValueNow()).toBe(null);
    expect(h.value()).toBe(null);
    expect(h.input).not.toHaveAttribute("aria-valuetext");
    expect(h.display()).toBe("");
  });
});

describe("a11y edge — invalid state from out-of-range value", () => {
  it("a value above maxValue sets aria-invalid", () => {
    const h = renderField({ defaultValue: 150, maxValue: 100, allowOutOfRange: true });
    expect(h.input).toHaveAttribute("aria-invalid", "true");
    expect(h.value()).toBe(150);
  });

  it("a value below minValue sets aria-invalid", () => {
    const h = renderField({ defaultValue: -5, minValue: 0, allowOutOfRange: true });
    expect(h.input).toHaveAttribute("aria-invalid", "true");
    expect(h.value()).toBe(-5);
  });

  it("an in-range value leaves aria-invalid unset", () => {
    const h = renderField({ defaultValue: 50, minValue: 0, maxValue: 100 });
    expect(h.input).not.toHaveAttribute("aria-invalid");
    expect(h.value()).toBe(50);
  });

  it("out-of-range alone (no validate error) does not link aria-errormessage", () => {
    const h = renderField({ defaultValue: 150, maxValue: 100, allowOutOfRange: true });
    expect(h.input).toHaveAttribute("aria-invalid", "true");
    expect(h.input).not.toHaveAttribute("aria-errormessage");
  });
});

describe("a11y edge — validate failure wires aria-invalid + aria-errormessage", () => {
  it("validate returning a string sets aria-invalid and links aria-errormessage to the message id", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={-5}
        validate={(v) => (v !== null && v < 0 ? "Must be positive" : true)}
      >
        <NumberField.Group>
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
        <NumberField.ErrorMessage data-testid="err" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input") as HTMLInputElement;
    const err = screen.getByTestId("err");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const errId = input.getAttribute("aria-errormessage");
    expect(errId).toBeTruthy();
    expect(err.id).toBe(errId);
    expect(err.textContent).toBe("Must be positive");
  });

  it("validate returning a string sets data-invalid on the root and renders the message", () => {
    render(
      <NumberField.Root
        data-testid="root"
        locale="en-US"
        defaultValue={3}
        validate={(v) => (v !== null && v % 2 !== 0 ? "Must be even" : true)}
      >
        <NumberField.Group>
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
        <NumberField.ErrorMessage data-testid="err" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("root")).toHaveAttribute("data-invalid", "");
    expect(screen.getByTestId("err").textContent).toBe("Must be even");
  });

  it("a passing validate leaves aria-invalid and aria-errormessage unset and hides the message", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={5}
        validate={(v) => (v !== null && v > 0 ? true : "Must be positive")}
      >
        <NumberField.Group>
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
        <NumberField.ErrorMessage data-testid="err" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input") as HTMLInputElement;
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-errormessage");
    expect(screen.queryByTestId("err")).toBeNull();
  });

  it("validate returning false sets aria-invalid but links no aria-errormessage (no string)", () => {
    const h = renderField({
      defaultValue: 3,
      validate: (v) => v !== null && v % 2 === 0,
    });
    expect(h.input).toHaveAttribute("aria-invalid", "true");
    expect(h.input).not.toHaveAttribute("aria-errormessage");
    expect(h.value()).toBe(3);
  });
});

describe("a11y edge — HiddenInput carries the raw numeric value", () => {
  it("hidden input holds the unformatted number while the display is formatted", () => {
    const h = renderField({
      name: "price",
      defaultValue: 1234.5,
      formatOptions: { style: "currency", currency: "USD" },
    });
    expect(h.hidden()).toBe("1234.5");
    expect(norm(h.display())).toBe("$1,234.50");
    expect(h.value()).toBe(1234.5);
  });

  it("hidden input is empty when there is no value", () => {
    const h = renderField({ name: "price" });
    expect(h.hidden()).toBe("");
    expect(h.display()).toBe("");
    expect(h.value()).toBe(null);
  });
});

describe("a11y edge — non-finite defaults degrade to empty", () => {
  it("NaN defaultValue yields an empty hidden input, no aria-valuenow, and empty display", () => {
    const h = renderField({ name: "qty", defaultValue: Number.NaN });
    expect(h.hidden()).toBe("");
    expect(h.ariaValueNow()).toBe(null);
    expect(h.value()).toBe(null);
    expect(h.display()).toBe("");
    expect(h.input).not.toHaveAttribute("aria-valuetext");
  });

  it("Infinity defaultValue yields an empty hidden input, no aria-valuenow, and empty display", () => {
    const h = renderField({ name: "qty", defaultValue: Number.POSITIVE_INFINITY });
    expect(h.hidden()).toBe("");
    expect(h.ariaValueNow()).toBe(null);
    expect(h.value()).toBe(null);
    expect(h.display()).toBe("");
  });
});

describe("a11y edge — negative zero", () => {
  it("typing -0 commits aria-valuenow '0' and displays '0'", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "-0");
    await h.user.tab();
    expect(h.ariaValueNow()).toBe("0");
    expect(h.value()).toBe(0);
    expect(h.display()).toBe("0");
  });
});
