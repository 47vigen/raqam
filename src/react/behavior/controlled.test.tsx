import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberField } from "../NumberField.js";
import { norm } from "../../test-utils.js";

/**
 * Controlled-component behavior.
 *
 * These cannot use the shared `renderField` harness directly: a controlled
 * field is driven by an external `value` prop that the *parent* owns, so each
 * test builds a tiny wrapper with React.useState that passes `value` + `onChange`
 * and exposes buttons to mutate the value from outside (the real consumer wiring).
 * We then assert the rendered input reflects the external value, and — for the
 * typing case — that user keystrokes round-trip back through onChange → value →
 * display. Always read the live input via getByTestId("input").
 */

type Val = number | null;
const getInput = () => screen.getByTestId("input") as HTMLInputElement;
const valueNow = () => {
  const a = getInput().getAttribute("aria-valuenow");
  return a == null ? null : Number(a);
};

/** Controlled wrapper: parent owns `value`; buttons mutate it externally. */
function Controlled({
  initial,
  setTo,
  rootProps = {},
}: {
  initial: Val;
  /** ordered list of external values a corresponding button will set */
  setTo?: Val[];
  rootProps?: Record<string, unknown>;
}) {
  const [value, setValue] = React.useState<Val>(initial);
  return (
    <>
      <NumberField.Root locale="en-US" {...rootProps} value={value} onChange={setValue}>
        <NumberField.Group>
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
      {(setTo ?? []).map((v, i) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: stable test buttons
          key={i}
          type="button"
          data-testid={`set-${i}`}
          onClick={() => setValue(v)}
        >
          set {String(v)}
        </button>
      ))}
    </>
  );
}

describe("controlled NumberField", () => {
  it("external value change 100 -> 200 updates the displayed input to 200", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={100} setTo={[200]} />);
    expect(getInput().value).toBe("100");
    expect(valueNow()).toBe(100);

    await user.click(screen.getByTestId("set-0"));

    expect(getInput().value).toBe("200");
    expect(valueNow()).toBe(200);
  });

  it("external reset to null clears the displayed input", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={100} setTo={[null]} />);
    expect(getInput().value).toBe("100");
    expect(valueNow()).toBe(100);

    await user.click(screen.getByTestId("set-0"));

    expect(getInput().value).toBe("");
    expect(valueNow()).toBe(null);
  });

  it("external value 0 shows '0' (not empty)", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={100} setTo={[0]} />);
    expect(getInput().value).toBe("100");

    await user.click(screen.getByTestId("set-0"));

    expect(getInput().value).toBe("0");
    expect(valueNow()).toBe(0);
  });

  it("controlled value set while the field is focused updates the display", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={100} setTo={[200]} />);
    await user.click(getInput()); // focus the field
    expect(getInput().value).toBe("100");

    await user.click(screen.getByTestId("set-0")); // external change while focused

    expect(getInput().value).toBe("200");
    expect(valueNow()).toBe(200);
  });

  it("react-hook-form-style reset (value -> new value) re-syncs the display", async () => {
    const user = userEvent.setup();
    // emulate form.reset({ amount: 42 }) then a later reset to null
    render(<Controlled initial={1234} setTo={[42, null]} />);
    expect(getInput().value).toBe("1,234");
    expect(valueNow()).toBe(1234);

    await user.click(screen.getByTestId("set-0"));
    expect(getInput().value).toBe("42");
    expect(valueNow()).toBe(42);

    await user.click(screen.getByTestId("set-1"));
    expect(getInput().value).toBe("");
    expect(valueNow()).toBe(null);
  });

  it("typing into a controlled field round-trips through onChange and displays '1,234'", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={null} />);
    const input = getInput();

    await user.click(input);
    await user.type(input, "1234");

    // value flowed out via onChange, parent stored it, display reflects grouping
    expect(norm(input.value)).toBe("1,234");
    expect(valueNow()).toBe(1234);

    await user.tab(); // blur/commit stays consistent
    expect(norm(getInput().value)).toBe("1,234");
    expect(valueNow()).toBe(1234);
  });

  it("value={NaN} on initial mount renders empty without crashing or re-render loops", () => {
    // A crash or "Too many re-renders" would throw out of render().
    expect(() =>
      render(<Controlled initial={Number.NaN} />)
    ).not.toThrow();
    expect(getInput().value).toBe("");
    expect(valueNow()).toBe(null);
  });

  it("value transitions number -> NaN -> number without crashing", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={50} setTo={[Number.NaN, 75]} />);
    expect(getInput().value).toBe("50");
    expect(valueNow()).toBe(50);

    await user.click(screen.getByTestId("set-0")); // -> NaN
    expect(getInput().value).toBe("");
    expect(valueNow()).toBe(null);

    await user.click(screen.getByTestId("set-1")); // -> 75
    expect(getInput().value).toBe("75");
    expect(valueNow()).toBe(75);
  });

  it("value={-0} on mount displays '0' (no '-0')", () => {
    render(<Controlled initial={-0} />);
    expect(getInput().value).toBe("0");
    expect(valueNow()).toBe(0);
  });
});
