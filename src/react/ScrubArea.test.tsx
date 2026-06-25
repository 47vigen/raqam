import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberField } from "./NumberField.js";

// jsdom doesn't implement Pointer Lock API; define + mock it
function setupPointerLockMock() {
  let lockedElement: Element | null = null;

  // jsdom doesn't define these — define them if absent so vi.spyOn can wrap them
  if (!HTMLElement.prototype.requestPointerLock) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLElement.prototype as any).requestPointerLock = function() { return Promise.resolve(); };
  }
  if (!document.exitPointerLock) {
    document.exitPointerLock = function() {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.spyOn(HTMLElement.prototype as any, "requestPointerLock").mockImplementation(function(this: HTMLElement) {
    lockedElement = this;
    Object.defineProperty(document, "pointerLockElement", {
      get: () => lockedElement,
      configurable: true,
    });
    // Fire pointerlockchange synchronously (mimics browser behavior in tests)
    document.dispatchEvent(new Event("pointerlockchange"));
    return Promise.resolve();
  });

  vi.spyOn(document, "exitPointerLock").mockImplementation(() => {
    lockedElement = null;
    document.dispatchEvent(new Event("pointerlockchange"));
  });

  return {
    simulateMouseMove(movementX: number, movementY: number) {
      const event = new MouseEvent("mousemove", { bubbles: true });
      Object.defineProperty(event, "movementX", { value: movementX });
      Object.defineProperty(event, "movementY", { value: movementY });
      document.dispatchEvent(event);
    },
    get lockedElement() { return lockedElement; },
  };
}

describe("NumberField.ScrubArea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderScrubField(props = {}) {
    const onChange = vi.fn();
    const { container } = render(
      <NumberField.Root defaultValue={50} minValue={0} maxValue={100} onChange={onChange} {...props}>
        <NumberField.Label>Value</NumberField.Label>
        <NumberField.ScrubArea data-testid="scrub-area">
          <span>Drag</span>
        </NumberField.ScrubArea>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    return { container, onChange };
  }

  it("renders ScrubArea with role=slider", () => {
    renderScrubField();
    const scrubArea = screen.getByTestId("scrub-area");
    expect(scrubArea).toBeInTheDocument();
    expect(scrubArea).toHaveAttribute("role", "slider");
  });

  it("is focusable (tabIndex=0)", () => {
    renderScrubField();
    const scrubArea = screen.getByTestId("scrub-area");
    expect(scrubArea).toHaveAttribute("tabindex", "0");
  });

  it("has ew-resize cursor by default (horizontal direction)", () => {
    renderScrubField();
    const scrubArea = screen.getByTestId("scrub-area");
    expect(scrubArea).toHaveStyle({ cursor: "ew-resize" });
  });

  it("has ns-resize cursor for vertical direction", () => {
    render(
      <NumberField.Root defaultValue={50}>
        <NumberField.ScrubArea direction="vertical" data-testid="scrub-area">
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    const scrubArea = screen.getByTestId("scrub-area");
    expect(scrubArea).toHaveStyle({ cursor: "ns-resize" });
  });

  it("increments value on ArrowRight key", async () => {
    const onChange = vi.fn();
    render(
      <NumberField.Root defaultValue={50} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    const scrubArea = screen.getByTestId("scrub-area");
    scrubArea.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it("decrements value on ArrowLeft key", async () => {
    const onChange = vi.fn();
    render(
      <NumberField.Root defaultValue={50} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    const scrubArea = screen.getByTestId("scrub-area");
    scrubArea.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it("sets data-scrubbing on scrub area and root during pointer lock", () => {
    const mock = setupPointerLockMock();

    const { container } = render(
      <NumberField.Root defaultValue={50}>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrubArea = screen.getByTestId("scrub-area");
    const root = container.firstChild as HTMLElement;

    // Before scrubbing
    expect(scrubArea).not.toHaveAttribute("data-scrubbing");
    expect(root).not.toHaveAttribute("data-scrubbing");

    // Trigger pointer lock via React's fireEvent (triggers synthetic onPointerDown)
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });

    // After lock acquired
    expect(scrubArea).toHaveAttribute("data-scrubbing", "");
    expect(root).toHaveAttribute("data-scrubbing", "");

    void mock;
  });

  it("increments on rightward mouse movement (horizontal)", () => {
    const mock = setupPointerLockMock();
    const onChange = vi.fn();

    render(
      <NumberField.Root defaultValue={50} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={4}>
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrubArea = screen.getByTestId("scrub-area");
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });

    // 4 pixels → 1 step
    mock.simulateMouseMove(4, 0);
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it("decrements on leftward mouse movement", () => {
    const mock = setupPointerLockMock();
    const onChange = vi.fn();

    render(
      <NumberField.Root defaultValue={50} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={4}>
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrubArea = screen.getByTestId("scrub-area");
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });

    mock.simulateMouseMove(-4, 0);
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it("does not respond to pointer down when disabled", () => {
    const mock = setupPointerLockMock();

    render(
      <NumberField.Root defaultValue={50} disabled>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrubArea = screen.getByTestId("scrub-area");
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });

    expect(mock.lockedElement).toBeNull();
  });

  it("reports change reason 'scrub' on keyboard scrub", async () => {
    const onValueChange = vi.fn();
    render(
      <NumberField.Root defaultValue={50} step={1} onValueChange={onValueChange}>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    screen.getByTestId("scrub-area").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(51, expect.objectContaining({ reason: "scrub" }));
  });

  it("reports change reason 'scrub' on pointer-lock drag", () => {
    const mock = setupPointerLockMock();
    const onValueChange = vi.fn();
    render(
      <NumberField.Root defaultValue={50} step={1} onValueChange={onValueChange}>
        <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={4}>
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    fireEvent.pointerDown(screen.getByTestId("scrub-area"), { button: 0, bubbles: true });
    mock.simulateMouseMove(4, 0);
    expect(onValueChange).toHaveBeenCalledWith(51, expect.objectContaining({ reason: "scrub" }));
  });

  it("does not hang when pixelSensitivity is 0 (clamps to 1px/step)", () => {
    const mock = setupPointerLockMock();
    const onChange = vi.fn();
    render(
      <NumberField.Root defaultValue={0} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={0}>
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    fireEvent.pointerDown(screen.getByTestId("scrub-area"), { button: 0, bubbles: true });
    // A 3px move produces a finite number of steps; an unclamped 0 sensitivity
    // would spin forever and time the test out instead.
    mock.simulateMouseMove(3, 0);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("uses a custom scrub aria-label", () => {
    render(
      <NumberField.Root defaultValue={1}>
        <NumberField.ScrubArea data-testid="scrub-area" label="Glisser pour changer">
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    expect(screen.getByTestId("scrub-area")).toHaveAttribute("aria-label", "Glisser pour changer");
  });

  it("exposes slider value/range ARIA", async () => {
    render(
      <NumberField.Root defaultValue={50} minValue={0} maxValue={100}>
        <NumberField.ScrubArea data-testid="scrub">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrub = screen.getByTestId("scrub");
    expect(scrub).toHaveAttribute("aria-valuenow", "50");
    expect(scrub).toHaveAttribute("aria-valuemin", "0");
    expect(scrub).toHaveAttribute("aria-valuemax", "100");
    expect(scrub.getAttribute("aria-valuetext")).not.toBeNull();

    scrub.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(scrub).toHaveAttribute("aria-valuenow", "51");
  });

  it("diagonal direction follows the dominant axis", () => {
    const mock = setupPointerLockMock();
    const onChange = vi.fn();

    render(
      <NumberField.Root defaultValue={50} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area" direction="both" pixelSensitivity={4}>
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrubArea = screen.getByTestId("scrub-area");
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });

    // Dominant +X (|dx| >= |dy|) → uses dx → increment (up from 50).
    mock.simulateMouseMove(8, 2);
    expect(onChange).toHaveBeenCalledWith(51);

    onChange.mockClear();

    // Dominant -Y (|dy| > |dx|) → uses -dy → up = increment (up from 50).
    mock.simulateMouseMove(2, -8);
    expect(onChange).toHaveBeenCalledWith(51);

    onChange.mockClear();

    // Sanity: dominant +Y (|dy| > |dx|) → uses -dy → down = decrement.
    mock.simulateMouseMove(2, 8);
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it("clears scrubbing state on pointer-lock release", () => {
    const mock = setupPointerLockMock();
    const onChange = vi.fn();

    render(
      <NumberField.Root defaultValue={50} step={1} onChange={onChange}>
        <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={4}>
          Drag
        </NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );

    const scrubArea = screen.getByTestId("scrub-area");
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });
    expect(scrubArea).toHaveAttribute("data-scrubbing", "");

    // Release the lock — the mock fires pointerlockchange synchronously.
    act(() => {
      document.exitPointerLock();
    });

    expect(scrubArea).not.toHaveAttribute("data-scrubbing");

    // A subsequent move must no longer change the value.
    onChange.mockClear();
    mock.simulateMouseMove(4, 0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("omits aria-valuemin/max on the scrub area for non-finite bounds", () => {
    render(
      <NumberField.Root defaultValue={50} minValue={Number.NaN} maxValue={Number.POSITIVE_INFINITY}>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    const scrub = screen.getByTestId("scrub-area");
    expect(scrub).not.toHaveAttribute("aria-valuemin");
    expect(scrub).not.toHaveAttribute("aria-valuemax");
  });

  it("clears the root scrubbing state when only the scrub area unmounts mid-scrub", () => {
    setupPointerLockMock();
    function Harness({ showScrub }: { showScrub: boolean }) {
      return (
        <NumberField.Root defaultValue={50}>
          {showScrub ? (
            <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
          ) : null}
          <NumberField.Input />
        </NumberField.Root>
      );
    }
    const { container, rerender } = render(<Harness showScrub={true} />);
    const root = container.firstChild as HTMLElement;
    fireEvent.pointerDown(screen.getByTestId("scrub-area"), { button: 0, bubbles: true });
    expect(root).toHaveAttribute("data-scrubbing", "");

    // Unmount ONLY the scrub area; Root stays mounted.
    rerender(<Harness showScrub={false} />);
    expect(root).not.toHaveAttribute("data-scrubbing");
  });

  it("exits pointer lock when the scrub area unmounts mid-scrub", () => {
    setupPointerLockMock();
    const { unmount } = render(
      <NumberField.Root defaultValue={50}>
        <NumberField.ScrubArea data-testid="scrub-area">Drag</NumberField.ScrubArea>
        <NumberField.Input />
      </NumberField.Root>
    );
    const scrubArea = screen.getByTestId("scrub-area");
    fireEvent.pointerDown(scrubArea, { button: 0, bubbles: true });
    expect(document.pointerLockElement).toBe(scrubArea);

    unmount();
    // Cleanup must release the lock so the user isn't stranded with a hidden cursor.
    expect(document.exitPointerLock).toHaveBeenCalled();
  });
});
