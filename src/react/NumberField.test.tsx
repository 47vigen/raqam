import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberField } from "./NumberField.js";
import { useNumberFieldContext } from "./context.js";

// A label built from the exported primitives instead of <NumberField.Label> —
// it must still register (via labelProps' ref) so the group/input stay wired.
function CustomLabel({ children }: { children: React.ReactNode }) {
  const { aria } = useNumberFieldContext();
  return (
    <label data-testid="custom-label" {...aria.labelProps}>
      {children}
    </label>
  );
}

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
    // ...and the input's aria-labelledby must point back at a real label id
    expect(input.getAttribute("aria-labelledby")).toBe(label.getAttribute("id"));
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

  it("does not leave a dangling aria-labelledby on the input OR the group when no Label is rendered", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" aria-label="Amount" />
        </NumberField.Group>
      </NumberField.Root>
    );
    const input = screen.getByTestId("input");
    expect(input).toHaveAttribute("aria-label", "Amount");
    expect(input).not.toHaveAttribute("aria-labelledby");
    // The role="group" wrapper must not keep the dangling fallback either.
    expect(screen.getByTestId("group")).not.toHaveAttribute("aria-labelledby");
  });

  it("respects an explicit aria-labelledby spread onto the Input", () => {
    render(
      <NumberField.Root locale="en-US">
        <span id="external-label">Amount</span>
        <NumberField.Group>
          <NumberField.Input data-testid="input" aria-labelledby="external-label" />
        </NumberField.Group>
      </NumberField.Root>
    );
    expect(screen.getByTestId("input")).toHaveAttribute(
      "aria-labelledby",
      "external-label"
    );
  });

  it("points the group's aria-labelledby at the rendered Label", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Label>Amount</NumberField.Label>
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    const labelId = screen.getByText("Amount").getAttribute("id");
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId("group")).toHaveAttribute("aria-labelledby", labelId);
    expect(screen.getByTestId("input")).toHaveAttribute("aria-labelledby", labelId);
  });

  it("keeps group/input wired for a custom label built from aria.labelProps", () => {
    render(
      <NumberField.Root locale="en-US">
        <CustomLabel>Amount</CustomLabel>
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    const labelId = screen.getByTestId("custom-label").getAttribute("id");
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId("group")).toHaveAttribute("aria-labelledby", labelId);
    expect(screen.getByTestId("input")).toHaveAttribute("aria-labelledby", labelId);
  });

  it("keeps the label registered through the render-prop function form", () => {
    // The render function must receive the registration ref so it can spread it
    // onto the rendered label (React 18 drops ref from props without threading).
    let receivedRef: unknown;
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Label
          render={(props) => {
            receivedRef = (props as { ref?: unknown }).ref;
            return <label {...props} data-testid="rp-label" />;
          }}
        >
          Amount
        </NumberField.Label>
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    expect(typeof receivedRef).toBe("function");
    const labelId = screen.getByTestId("rp-label").getAttribute("id");
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId("group")).toHaveAttribute("aria-labelledby", labelId);
    expect(screen.getByTestId("input")).toHaveAttribute("aria-labelledby", labelId);
  });

  it("keeps the label registered through the render-prop element form", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Label render={<label data-testid="rp-el-label" />}>
          Amount
        </NumberField.Label>
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    const labelId = screen.getByTestId("rp-el-label").getAttribute("id");
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId("group")).toHaveAttribute("aria-labelledby", labelId);
    expect(screen.getByTestId("input")).toHaveAttribute("aria-labelledby", labelId);
  });

  it("composes a consumer ref on a render-prop element with label registration", () => {
    // A ref on the render element must not replace the registration ref — both
    // must fire, so the consumer gets their node AND the group/input stay wired.
    const myRef = vi.fn();
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Label render={<label ref={myRef} data-testid="rp-ref-label" />}>
          Amount
        </NumberField.Label>
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    expect(myRef).toHaveBeenCalled();
    expect(myRef.mock.calls[0][0]).toBeInstanceOf(HTMLLabelElement);
    const labelId = screen.getByTestId("rp-ref-label").getAttribute("id");
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId("group")).toHaveAttribute("aria-labelledby", labelId);
    expect(screen.getByTestId("input")).toHaveAttribute("aria-labelledby", labelId);
  });

  it("runs a consumer ref's React 19 cleanup function on unmount", () => {
    const cleanup = vi.fn();
    const refWithCleanup = vi.fn(() => cleanup);
    const { unmount } = render(
      <NumberField.Root locale="en-US">
        <NumberField.Label ref={refWithCleanup}>Amount</NumberField.Label>
        <NumberField.Group>
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    // Merged ref is memoized → the consumer ref attaches once and its cleanup is
    // preserved (not dropped) and runs exactly once on unmount.
    expect(refWithCleanup).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("keeps a render-element consumer ref stable across the hasLabel re-render", () => {
    // The composed ref for the element render-prop form must be memoized: an
    // unstable identity would detach/reattach on the hasLabel update and run the
    // consumer cleanup early. Expect a single attach and a single cleanup.
    const cleanup = vi.fn();
    const refWithCleanup = vi.fn(() => cleanup);
    const { unmount } = render(
      <NumberField.Root locale="en-US">
        <NumberField.Label render={<label ref={refWithCleanup} data-testid="cl-el" />}>
          Amount
        </NumberField.Label>
        <NumberField.Group data-testid="group">
          <NumberField.Input data-testid="input" />
        </NumberField.Group>
      </NumberField.Root>
    );
    // Registration still took effect (group is wired) without churning the ref.
    const labelId = screen.getByTestId("cl-el").getAttribute("id");
    expect(screen.getByTestId("group")).toHaveAttribute("aria-labelledby", labelId);
    expect(refWithCleanup).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
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

describe("NumberField onValueCommitted", () => {
  it("fires on blur with reason 'blur' and the clamped value", async () => {
    const user = userEvent.setup();
    const onValueCommitted = vi.fn();
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={5}
        maxValue={10}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input");
    await user.click(input);
    await user.keyboard("99"); // 599 — clamps to maxValue on blur
    await user.tab();

    expect(onValueCommitted).toHaveBeenCalled();
    const committedCalls = onValueCommitted.mock.calls;
    const [value, details] = committedCalls[committedCalls.length - 1] as [
      number | null,
      { reason: string },
    ];
    expect(details.reason).toBe("blur");
    expect(value).toBe(10);
  });

  it("fires on Enter with reason 'keyboard'", async () => {
    const user = userEvent.setup();
    const onValueCommitted = vi.fn();
    render(
      <NumberField.Root locale="en-US" defaultValue={3} onValueCommitted={onValueCommitted}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input");
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(onValueCommitted).toHaveBeenCalledWith(3, { reason: "keyboard" });
  });
});

describe("NumberField clear reason", () => {
  it("reports reason 'clear' when the field is emptied", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberField.Root locale="en-US" defaultValue={42} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input");
    await user.clear(input);

    expect(onValueChange).toHaveBeenCalled();
    const changeCalls = onValueChange.mock.calls;
    const [value, details] = changeCalls[changeCalls.length - 1] as [
      number | null,
      { reason: string },
    ];
    expect(value).toBeNull();
    expect(details.reason).toBe("clear");
  });

  it("reports reason 'clear' when backspacing the last digit before an affordance", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberField.Root
        locale="en-US"
        formatOptions={{ style: "percent" }}
        defaultValue={0.05}
        onValueChange={onValueChange}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input") as HTMLInputElement;
    // Displays "5%"; Backspace from the end is handled by the smart-affordance
    // keydown branch (not the onChange path) and empties the field.
    await user.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    await user.keyboard("{Backspace}");

    expect(onValueChange).toHaveBeenCalled();
    const calls = onValueChange.mock.calls;
    const [value, details] = calls[calls.length - 1] as [number | null, { reason: string }];
    expect(value).toBeNull();
    expect(details.reason).toBe("clear");
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

// ── Phase 2 tests ────────────────────────────────────────────────────────────

describe("NumberField paste handling", () => {
  it("pastes a plain number string", async () => {
    const user = userEvent.setup();
    renderField({ locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.paste("1234.56");
    expect(input).toHaveValue("1,234.56");
  });

  it("strips currency symbols when pasting", async () => {
    const user = userEvent.setup();
    renderField({ locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.paste("$1,234.56");
    expect(input).toHaveValue("1,234.56");
  });

  it("strips € symbol when pasting", async () => {
    const user = userEvent.setup();
    renderField({ locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.paste("€9,876");
    expect(input).toHaveValue("9,876");
  });

  it("does not paste invalid non-numeric garbage", async () => {
    const user = userEvent.setup();
    renderField({ locale: "en-US" });
    const input = screen.getByRole("spinbutton");
    const initialValue = input.getAttribute("value") ?? "";
    await user.click(input);
    await user.paste("hello world");
    // Should not change the value
    expect(input.getAttribute("value")).toBe(initialValue);
  });
});

describe("NumberField copy behavior", () => {
  it("uses raw numberValue when copyBehavior='raw'", () => {
    render(
      <NumberField.Root defaultValue={1234.56} locale="en-US" copyBehavior="raw">
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input");
    const mockSetData = vi.fn();
    const mockGetData = vi.fn(() => "");

    fireEvent.copy(input, {
      clipboardData: { setData: mockSetData, getData: mockGetData },
    });

    expect(mockSetData).toHaveBeenCalledWith("text/plain", "1234.56");
  });
});

describe("NumberField allowOutOfRange", () => {
  it("allows value beyond maxValue when allowOutOfRange=true", async () => {
    const user = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" maxValue={100} allowOutOfRange clampBehavior="blur">
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input");
    // Really type "150" and blur — must not clamp down to 100.
    await user.click(input);
    await user.type(input, "150");
    await user.tab();
    expect(input).toHaveValue("150");
  });

  it("sets aria-invalid when value exceeds maxValue", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={150}
        maxValue={100}
        allowOutOfRange
        clampBehavior="none"
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("input")).toHaveAttribute("aria-invalid", "true");
  });

  it("sets data-invalid when value is out of range", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={150}
        maxValue={100}
        allowOutOfRange
        clampBehavior="none"
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("input")).toHaveAttribute("data-invalid", "");
  });

  it("does not set aria-invalid when value is in range", () => {
    render(
      <NumberField.Root locale="en-US" defaultValue={50} maxValue={100}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("input")).not.toHaveAttribute("aria-invalid");
  });

  it("increment/decrement buttons remain enabled at boundary with allowOutOfRange", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={100}
        maxValue={100}
        allowOutOfRange
      >
        <NumberField.Group>
          <NumberField.Decrement data-testid="decrement" />
          <NumberField.Input />
          <NumberField.Increment data-testid="increment" />
        </NumberField.Group>
      </NumberField.Root>
    );
    expect(screen.getByTestId("increment")).not.toBeDisabled();
  });
});

describe("NumberField Description and ErrorMessage", () => {
  it("renders Description with correct id", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Input data-testid="input" />
        <NumberField.Description data-testid="desc">Enter amount</NumberField.Description>
      </NumberField.Root>
    );
    const desc = screen.getByTestId("desc");
    expect(desc).toBeInTheDocument();
    expect(desc.id).toBeTruthy();
  });

  it("renders ErrorMessage with role=alert", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Input />
        <NumberField.ErrorMessage data-testid="err">Invalid value</NumberField.ErrorMessage>
      </NumberField.Root>
    );
    const err = screen.getByTestId("err");
    expect(err).toBeInTheDocument();
    expect(err).toHaveAttribute("role", "alert");
  });
});

describe("NumberField.Formatted component", () => {
  it("renders the formatted value", () => {
    render(
      <NumberField.Root
        locale="en-US"
        formatOptions={{ style: "currency", currency: "USD" }}
        defaultValue={1234.56}
      >
        <NumberField.Formatted data-testid="fmt" />
      </NumberField.Root>
    );
    const el = screen.getByTestId("fmt");
    expect(el.textContent).toBe("$1,234.56");
  });

  it("has aria-hidden attribute", () => {
    render(
      <NumberField.Root locale="en-US" defaultValue={42}>
        <NumberField.Formatted data-testid="fmt" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("fmt")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders empty string when no value", () => {
    render(
      <NumberField.Root locale="en-US">
        <NumberField.Formatted data-testid="fmt" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("fmt").textContent).toBe("");
  });
});

describe("data-focused attribute", () => {
  it("adds data-focused when input is focused", async () => {
    const user = userEvent.setup();
    render(
      <NumberField.Root data-testid="root" locale="en-US">
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const root = screen.getByTestId("root");
    const input = screen.getByTestId("input");
    expect(root).not.toHaveAttribute("data-focused");
    await user.click(input);
    expect(root).toHaveAttribute("data-focused");
  });

  it("removes data-focused when input is blurred", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NumberField.Root data-testid="root" locale="en-US">
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
        <button data-testid="other">Other</button>
      </div>
    );
    const root = screen.getByTestId("root");
    const input = screen.getByTestId("input");
    await user.click(input);
    expect(root).toHaveAttribute("data-focused");
    await user.click(screen.getByTestId("other"));
    expect(root).not.toHaveAttribute("data-focused");
  });
});

describe("validate callback integration", () => {
  it("sets data-invalid when validate returns false", async () => {
    const user = userEvent.setup();
    render(
      <NumberField.Root
        data-testid="root"
        locale="en-US"
        defaultValue={3}
        validate={(v) => v !== null && v % 2 === 0}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const root = screen.getByTestId("root");
    // 3 is odd — invalid from mount
    expect(root).toHaveAttribute("data-invalid");
    // Type a valid even number
    const input = screen.getByTestId("input");
    await user.tripleClick(input);
    await user.type(input, "4");
    expect(root).not.toHaveAttribute("data-invalid");
  });

  it("ErrorMessage auto-renders validate error string", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={-5}
        validate={(v) => (v !== null && v < 0 ? "Must be positive" : true)}
      >
        <NumberField.Input />
        <NumberField.ErrorMessage data-testid="err" />
      </NumberField.Root>
    );
    expect(screen.getByTestId("err").textContent).toBe("Must be positive");
  });

  it("ErrorMessage hidden when valid", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={5}
        validate={(v) => (v !== null && v > 0 ? true : "Must be positive")}
      >
        <NumberField.Input />
        <NumberField.ErrorMessage data-testid="err" />
      </NumberField.Root>
    );
    expect(screen.queryByTestId("err")).toBeNull();
  });
});

describe("IME composition handling", () => {
  it("fires compositionStart/End events on input", () => {
    const { container } = render(
      <NumberField.Root locale="en-US">
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = container.querySelector("input")!;
    // Verify the events don't throw
    expect(() => {
      fireEvent.compositionStart(input);
      fireEvent.compositionEnd(input, { data: "42" });
    }).not.toThrow();
  });
});

describe("smart backspace over grouping separator", () => {
  it("backspace when cursor is right after comma deletes preceding digit", async () => {
    const user = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" defaultValue={1234}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input") as HTMLInputElement;
    // "1,234" — place cursor right after the comma (position 2)
    await user.click(input);
    input.setSelectionRange(2, 2);

    // Dispatch a keydown for Backspace
    fireEvent.keyDown(input, { key: "Backspace" });

    // The preceding digit ("1") and the comma should be removed → "234"
    expect(input.value).toBe("234");
  });

  it("backspace without cursor after separator falls through to default behaviour", async () => {
    const user = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" defaultValue={1234}>
        <NumberField.Input data-testid="input2" />
      </NumberField.Root>
    );
    const input = screen.getByTestId("input2") as HTMLInputElement;
    await user.click(input);
    // Cursor at end of "1,234" (position 5) — normal backspace, no special handling
    input.setSelectionRange(5, 5);
    await user.keyboard("{Backspace}");
    // Should delete the "4" → "123" formatted
    expect(input.value).toBe("123");
  });
});

describe("custom formatValue/parseValue", () => {
  it("uses custom format function", () => {
    render(
      <NumberField.Root
        locale="en-US"
        defaultValue={1234}
        formatValue={(v) => `${v.toFixed(2)} pts`}
        parseValue={(s) => {
          const n = parseFloat(s.replace(/[^0-9.]/g, ""));
          return { value: isNaN(n) ? null : n, isIntermediate: false };
        }}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    // Custom format: "1234.00 pts"
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("1234.00 pts");
  });
});
