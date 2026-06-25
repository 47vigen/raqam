import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePressAndHold } from "./usePressAndHold.js";

describe("usePressAndHold", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makePointerEvent(button = 0): React.PointerEvent {
    return {
      button,
      pointerType: "mouse",
      preventDefault: vi.fn(),
    } as unknown as React.PointerEvent;
  }

  it("fires callback immediately on pointerDown", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => usePressAndHold(cb));

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not fire immediately on pointerDown when disabled", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => usePressAndHold(cb, { disabled: true }));

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    expect(cb).toHaveBeenCalledTimes(0);
  });

  it("does not fire on non-primary button (right-click)", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => usePressAndHold(cb));

    act(() => {
      result.current.onPointerDown(makePointerEvent(2));
    });

    expect(cb).toHaveBeenCalledTimes(0);
  });

  it("starts repeating after delay", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      usePressAndHold(cb, { delay: 400, interval: 200 })
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    expect(cb).toHaveBeenCalledTimes(1);

    // Not yet — within delay period
    act(() => { vi.advanceTimersByTime(399); });
    expect(cb).toHaveBeenCalledTimes(1);

    // After delay, first repeat fires
    act(() => { vi.advanceTimersByTime(1); });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("accelerates repeats", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      usePressAndHold(cb, { delay: 400, interval: 200 })
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    // 0ms: immediate fire → count = 1
    expect(cb).toHaveBeenCalledTimes(1);

    // 400ms: initial delay fires first repeat → count = 2
    act(() => { vi.advanceTimersByTime(400); });
    expect(cb).toHaveBeenCalledTimes(2);

    // +200ms: second repeat (interval=200) → count = 3
    act(() => { vi.advanceTimersByTime(200); });
    expect(cb).toHaveBeenCalledTimes(3);

    // +100ms: third repeat (interval halved to 100) → count = 4
    act(() => { vi.advanceTimersByTime(100); });
    expect(cb).toHaveBeenCalledTimes(4);

    // +50ms: fourth repeat (halved to 50) → count = 5
    act(() => { vi.advanceTimersByTime(50); });
    expect(cb).toHaveBeenCalledTimes(5);

    // floor reached — stays at 50ms
    act(() => { vi.advanceTimersByTime(50); });
    expect(cb).toHaveBeenCalledTimes(6);
  });

  it("stops repeating on pointerUp", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      usePressAndHold(cb, { delay: 400, interval: 200 })
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    act(() => { vi.advanceTimersByTime(400); });
    expect(cb).toHaveBeenCalledTimes(2);

    // Release
    act(() => {
      result.current.onPointerUp(makePointerEvent());
    });

    // No more fires
    act(() => { vi.advanceTimersByTime(2000); });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("stops repeating on pointerLeave", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      usePressAndHold(cb, { delay: 400, interval: 200 })
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    act(() => { vi.advanceTimersByTime(400); });
    expect(cb).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.onPointerLeave(makePointerEvent());
    });

    act(() => { vi.advanceTimersByTime(2000); });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("stops repeating when disabled mid-hold (no pointerUp)", () => {
    const cb = vi.fn();
    const { result, rerender } = renderHook(
      ({ disabled }: { disabled: boolean }) =>
        usePressAndHold(cb, { delay: 400, interval: 200, disabled }),
      { initialProps: { disabled: false } }
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    // immediate fire + first repeat at the 400ms delay → count = 2
    act(() => { vi.advanceTimersByTime(400); });
    expect(cb).toHaveBeenCalledTimes(2);

    // Become disabled mid-hold WITHOUT a pointerUp/leave to clear the timer.
    act(() => {
      rerender({ disabled: true });
    });

    const callsAtDisable = cb.mock.calls.length;

    // The runaway loop must have stopped — no further fires no matter how long.
    act(() => { vi.advanceTimersByTime(5000); });
    expect(cb).toHaveBeenCalledTimes(callsAtDisable);
  });

  it("stops repeating on pointerCancel", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      usePressAndHold(cb, { delay: 400, interval: 200 })
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    act(() => { vi.advanceTimersByTime(400); });
    expect(cb).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.onPointerCancel(makePointerEvent());
    });

    act(() => { vi.advanceTimersByTime(2000); });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("cancels pending timers on unmount", () => {
    const cb = vi.fn();
    const { result, unmount } = renderHook(() =>
      usePressAndHold(cb, { delay: 400, interval: 200 })
    );

    act(() => {
      result.current.onPointerDown(makePointerEvent());
    });

    unmount();

    // Timers should be cleared — no callbacks fired after unmount
    act(() => { vi.advanceTimersByTime(2000); });
    expect(cb).toHaveBeenCalledTimes(1); // Only the initial immediate fire
  });
});
