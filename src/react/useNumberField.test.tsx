import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRef } from "react";
import { useNumberField } from "./useNumberField.js";
import { useNumberFieldState } from "./useNumberFieldState.js";
import type { UseNumberFieldProps } from "../core/types.js";

// Wires the headless hooks together exactly like a consumer building their own
// markup would (the API surface that doesn't go through <NumberField.Root>).
function renderAria(props: UseNumberFieldProps) {
  return renderHook(() => {
    const inputRef = useRef<HTMLInputElement>(null);
    const state = useNumberFieldState(props);
    return useNumberField(props, state, inputRef);
  });
}

describe("useNumberField — aria-labelledby resolution", () => {
  it("omits aria-labelledby when only aria-label is provided (no dangling ref)", () => {
    // Regression: previously aria-labelledby always defaulted to `${id}-label`,
    // pointing at a <label> the consumer never rendered. With an aria-label and
    // no rendered label, aria-labelledby must not be set.
    const { result } = renderAria({ locale: "en-US", "aria-label": "Amount" });
    expect(result.current.inputProps["aria-label"]).toBe("Amount");
    expect(result.current.inputProps["aria-labelledby"]).toBeUndefined();
    expect(result.current.groupProps["aria-labelledby"]).toBeUndefined();
  });

  it("omits aria-labelledby until a label element is actually mounted", () => {
    // No element has spread labelProps yet, so there is nothing for
    // aria-labelledby to point at — it must stay unset rather than dangle.
    const { result } = renderAria({ locale: "en-US", id: "amount" });
    expect(result.current.labelProps.id).toBe("amount-label");
    expect(result.current.inputProps["aria-labelledby"]).toBeUndefined();
    expect(result.current.groupProps["aria-labelledby"]).toBeUndefined();
  });

  it("wires aria-labelledby to the label once labelProps' ref mounts", () => {
    const { result } = renderAria({ locale: "en-US", id: "amount" });
    // Simulate the label element mounting (any element that spreads labelProps).
    act(() => {
      result.current.labelProps.ref?.(document.createElement("label"));
    });
    expect(result.current.inputProps["aria-labelledby"]).toBe("amount-label");
    expect(result.current.groupProps["aria-labelledby"]).toBe("amount-label");
    expect(result.current.inputProps["aria-labelledby"]).toBe(
      result.current.labelProps.id
    );
  });

  it("respects an explicit aria-labelledby over the fallback and aria-label", () => {
    const { result } = renderAria({
      locale: "en-US",
      "aria-label": "Amount",
      "aria-labelledby": "external-label",
    });
    expect(result.current.inputProps["aria-labelledby"]).toBe("external-label");
    expect(result.current.groupProps["aria-labelledby"]).toBe("external-label");
  });
});
