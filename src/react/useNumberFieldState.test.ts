import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNumberFieldState } from "./useNumberFieldState.js";

describe("useNumberFieldState", () => {
  describe("initial value", () => {
    it("starts with empty string and null for no defaultValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      expect(result.current.inputValue).toBe("");
      expect(result.current.numberValue).toBeNull();
    });

    it("formats defaultValue on mount", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 1234 })
      );
      expect(result.current.inputValue).toBe("1,234");
      expect(result.current.numberValue).toBe(1234);
    });

    it("formats defaultValue with decimal", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 1234.56 })
      );
      expect(result.current.inputValue).toBe("1,234.56");
    });
  });

  describe("setInputValue", () => {
    it("parses and updates numberValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      act(() => result.current.setInputValue("1,234"));
      expect(result.current.numberValue).toBe(1234);
      expect(result.current.inputValue).toBe("1,234");
    });

    it("sets numberValue to null for empty string", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5 })
      );
      act(() => result.current.setInputValue(""));
      expect(result.current.numberValue).toBeNull();
    });

    it("preserves intermediate state without reformatting", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      act(() => result.current.setInputValue("1."));
      expect(result.current.inputValue).toBe("1.");
      expect(result.current.numberValue).toBeNull();
    });

    it("fires onChange when value changes", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", onChange })
      );
      act(() => result.current.setInputValue("42"));
      expect(onChange).toHaveBeenCalledWith(42);
    });
  });

  describe("setNumberValue", () => {
    it("formats and sets both values", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      act(() => result.current.setNumberValue(9999));
      expect(result.current.numberValue).toBe(9999);
      expect(result.current.inputValue).toBe("9,999");
    });

    it("clears both values when null", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5 })
      );
      act(() => result.current.setNumberValue(null));
      expect(result.current.numberValue).toBeNull();
      expect(result.current.inputValue).toBe("");
    });
  });

  describe("increment / decrement", () => {
    it("increments by default step (1)", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5 })
      );
      act(() => result.current.increment());
      expect(result.current.numberValue).toBe(6);
    });

    it("decrements by default step (1)", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5 })
      );
      act(() => result.current.decrement());
      expect(result.current.numberValue).toBe(4);
    });

    it("increments by custom step", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5, step: 5 })
      );
      act(() => result.current.increment());
      expect(result.current.numberValue).toBe(10);
    });

    it("increments by custom amount", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5 })
      );
      act(() => result.current.increment(10));
      expect(result.current.numberValue).toBe(15);
    });

    it("clamps increment at maxValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 9, maxValue: 10 })
      );
      act(() => result.current.increment());
      expect(result.current.numberValue).toBe(10);
      act(() => result.current.increment());
      expect(result.current.numberValue).toBe(10);
    });

    it("clamps decrement at minValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 1, minValue: 0 })
      );
      act(() => result.current.decrement());
      expect(result.current.numberValue).toBe(0);
      act(() => result.current.decrement());
      expect(result.current.numberValue).toBe(0);
    });

    it("handles floating point steps precisely", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 0.1, step: 0.1 })
      );
      act(() => result.current.increment());
      expect(result.current.numberValue).toBe(0.2);
    });
  });

  describe("canIncrement / canDecrement", () => {
    it("canIncrement is false at maxValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 10, maxValue: 10 })
      );
      expect(result.current.canIncrement).toBe(false);
    });

    it("canDecrement is false at minValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 0, minValue: 0 })
      );
      expect(result.current.canDecrement).toBe(false);
    });

    it("canIncrement is true below maxValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5, maxValue: 10 })
      );
      expect(result.current.canIncrement).toBe(true);
    });

    it("canIncrement/canDecrement are false when disabled", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", disabled: true })
      );
      expect(result.current.canIncrement).toBe(false);
      expect(result.current.canDecrement).toBe(false);
    });
  });

  describe("incrementToMax / decrementToMin", () => {
    it("jumps to maxValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 5, maxValue: 100 })
      );
      act(() => result.current.incrementToMax());
      expect(result.current.numberValue).toBe(100);
    });

    it("jumps to minValue", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US", defaultValue: 50, minValue: 0 })
      );
      act(() => result.current.decrementToMin());
      expect(result.current.numberValue).toBe(0);
    });
  });

  describe("commit (blur)", () => {
    it("re-formats on commit", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      act(() => result.current.setInputValue("1."));
      expect(result.current.inputValue).toBe("1.");
      act(() => result.current.commit());
      // After commit, intermediate state is cleaned up
      expect(result.current.inputValue).toBe("");
    });

    it("clamps to maxValue on blur when clampBehavior='blur'", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          maxValue: 100,
          clampBehavior: "blur",
        })
      );
      act(() => result.current.setInputValue("200"));
      act(() => result.current.commit());
      expect(result.current.numberValue).toBe(100);
    });

    it("does NOT clamp when clampBehavior='none'", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          maxValue: 100,
          clampBehavior: "none",
        })
      );
      act(() => result.current.setInputValue("200"));
      act(() => result.current.commit());
      expect(result.current.numberValue).toBe(200);
    });
  });

  describe("strict clamping", () => {
    it("ignores input that exceeds maxValue", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          maxValue: 100,
          clampBehavior: "strict",
          onChange,
        })
      );
      act(() => result.current.setInputValue("200"));
      // The value should not have changed
      expect(result.current.numberValue).toBeNull();
      expect(onChange).not.toHaveBeenCalledWith(200);
    });
  });
});
