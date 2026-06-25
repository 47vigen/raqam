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
      // Display preserved, but value already resolves to 1 (never wiped on blur).
      expect(result.current.numberValue).toBe(1);
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
      // Commit resolves the trailing-decimal value to "1" instead of wiping it.
      expect(result.current.inputValue).toBe("1");
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

  describe("allowOutOfRange", () => {
    it("allows typing values beyond maxValue when allowOutOfRange=true", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          maxValue: 100,
          clampBehavior: "blur",
          allowOutOfRange: true,
        })
      );
      act(() => result.current.setInputValue("200"));
      expect(result.current.numberValue).toBe(200);
    });

    it("does NOT clamp on blur when allowOutOfRange=true", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          maxValue: 100,
          clampBehavior: "blur",
          allowOutOfRange: true,
        })
      );
      act(() => result.current.setInputValue("200"));
      act(() => result.current.commit());
      expect(result.current.numberValue).toBe(200);
    });

    it("still clamps on blur when allowOutOfRange=false (default)", () => {
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

    it("does not apply strict clamping when allowOutOfRange=true", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          maxValue: 100,
          clampBehavior: "strict",
          allowOutOfRange: true,
        })
      );
      act(() => result.current.setInputValue("150"));
      expect(result.current.numberValue).toBe(150);
    });

    it("canIncrement is true at maxValue when allowOutOfRange=true", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          defaultValue: 100,
          maxValue: 100,
          allowOutOfRange: true,
        })
      );
      expect(result.current.canIncrement).toBe(true);
    });

    it("canDecrement is true at minValue when allowOutOfRange=true", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({
          locale: "en-US",
          defaultValue: 0,
          minValue: 0,
          allowOutOfRange: true,
        })
      );
      expect(result.current.canDecrement).toBe(true);
    });
  });

  describe("isScrubbing", () => {
    it("starts as false", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      expect(result.current.isScrubbing).toBe(false);
    });

    it("can be set to true via setIsScrubbing", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      act(() => result.current.setIsScrubbing(true));
      expect(result.current.isScrubbing).toBe(true);
    });

    it("can be set back to false", () => {
      const { result } = renderHook(() =>
        useNumberFieldState({ locale: "en-US" })
      );
      act(() => result.current.setIsScrubbing(true));
      act(() => result.current.setIsScrubbing(false));
      expect(result.current.isScrubbing).toBe(false);
    });
  });
});

describe("validate callback", () => {
  it("starts valid when no validate prop", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 5 })
    );
    expect(result.current.validationState).toBe("valid");
    expect(result.current.validationError).toBeNull();
  });

  it("validate returning false sets invalid state", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 3,
        validate: (v) => v !== null && v % 2 === 0,
      })
    );
    // 3 is odd — invalid
    expect(result.current.validationState).toBe("invalid");
    expect(result.current.validationError).toBeNull();
  });

  it("validate returning true sets valid state", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 4,
        validate: (v) => v !== null && v % 2 === 0,
      })
    );
    // 4 is even — valid
    expect(result.current.validationState).toBe("valid");
  });

  it("validate returning a string sets invalid with error message", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: -5,
        validate: (v) => (v !== null && v < 0 ? "Must be positive" : true),
      })
    );
    expect(result.current.validationState).toBe("invalid");
    expect(result.current.validationError).toBe("Must be positive");
  });

  it("re-validates on value change", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 1,
        validate: (v) => (v !== null && v >= 10 ? true : "Must be >= 10"),
      })
    );
    expect(result.current.validationState).toBe("invalid");
    act(() => result.current.setNumberValue(10));
    expect(result.current.validationState).toBe("valid");
    expect(result.current.validationError).toBeNull();
  });

  it("validate with null value", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        validate: (v) => (v === null ? "Required" : true),
      })
    );
    // Default value is null — should be invalid
    expect(result.current.validationState).toBe("invalid");
    expect(result.current.validationError).toBe("Required");
  });
});

describe("rawValue (arbitrary precision)", () => {
  it("starts null when no defaultValue", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    expect(result.current.rawValue).toBeNull();
  });

  it("initializes from defaultValue as string", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 1234.56 })
    );
    expect(result.current.rawValue).toBe("1234.56");
  });

  it("fires onRawChange with the unformatted string (grouping stripped)", () => {
    const onRaw = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", onRawChange: onRaw })
    );
    act(() => result.current.setInputValue("1,234.56"));
    expect(onRaw).toHaveBeenCalledWith("1234.56");
    expect(result.current.rawValue).toBe("1234.56");
  });

  it("strips currency/grouping affordances from rawValue, preserving precision", () => {
    const onRaw = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        formatOptions: { style: "currency", currency: "USD" },
        onRawChange: onRaw,
      })
    );
    // Trailing zero must survive (precision-preserving), affordances must not.
    act(() => result.current.setInputValue("$1,234.50"));
    expect(result.current.rawValue).toBe("1234.50");
    expect(onRaw).toHaveBeenCalledWith("1234.50");
  });

  it("emits the value-based rawValue for percent (strip is not the parse inverse)", () => {
    // "50%" parses to 0.5 but strips to "50"; rawValue must denote the value
    // (0.5), staying consistent with the defaultValue/setNumberValue paths.
    const onRaw = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", formatOptions: { style: "percent" }, onRawChange: onRaw })
    );
    act(() => result.current.setInputValue("50%"));
    expect(result.current.rawValue).toBe("0.5");
    expect(onRaw).toHaveBeenLastCalledWith("0.5");
  });

  it("never surfaces a '-0' rawValue", () => {
    const { result } = renderHook(() => useNumberFieldState({ locale: "en-US" }));
    act(() => result.current.setInputValue("-0"));
    expect(result.current.rawValue).toBe("0");
  });

  it("preserves precision beyond float in rawValue", () => {
    const { result } = renderHook(() => useNumberFieldState({ locale: "en-US" }));
    act(() => result.current.setInputValue("0.12345678901234567"));
    expect(result.current.rawValue).toBe("0.12345678901234567");
  });

  it("fires onRawChange with null when cleared", () => {
    const onRaw = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", onRawChange: onRaw })
    );
    act(() => result.current.setInputValue(""));
    expect(onRaw).toHaveBeenCalledWith(null);
  });

  it("fires onRawChange when setNumberValue is called", () => {
    const onRaw = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", onRawChange: onRaw })
    );
    act(() => result.current.setNumberValue(42.5));
    expect(onRaw).toHaveBeenCalledWith("42.5");
  });
});

describe("isFocused state", () => {
  it("starts false", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    expect(result.current.isFocused).toBe(false);
  });

  it("can be set to true", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setIsFocused(true));
    expect(result.current.isFocused).toBe(true);
  });

  it("can be toggled back to false", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setIsFocused(true));
    act(() => result.current.setIsFocused(false));
    expect(result.current.isFocused).toBe(false);
  });
});

describe("useNumberFieldState — numeric & config robustness", () => {
  it("increment never moves backward near MAX_SAFE_INTEGER", () => {
    const base = Number.MAX_SAFE_INTEGER;
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: base, step: 0.1 })
    );
    act(() => result.current.increment());
    expect(result.current.numberValue).not.toBeNull();
    expect(Number.isFinite(result.current.numberValue as number)).toBe(true);
    expect(result.current.numberValue as number).toBeGreaterThanOrEqual(base);
  });

  it("increment with a tiny step stays finite and moves up", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 1e9, step: 1e-7 })
    );
    act(() => result.current.increment());
    expect(Number.isFinite(result.current.numberValue as number)).toBe(true);
    expect(result.current.numberValue as number).toBeGreaterThan(1e9);
  });

  it("a sub-1e-15 step still registers (no precision-cap drop)", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 0, step: 1e-20 })
    );
    act(() => result.current.increment());
    // Must not round the step away to 0 — preciseAdd falls back to plain add.
    expect(result.current.numberValue).toBe(1e-20);
  });

  it("treats step=0 as the default (still steps by 1)", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 5, step: 0 })
    );
    act(() => result.current.increment());
    expect(result.current.numberValue).toBe(6);
  });

  it("never emits NaN/Infinity for a non-finite step", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 5, step: Number.NaN })
    );
    act(() => result.current.increment());
    expect(result.current.numberValue).toBe(6); // NaN step → default 1
  });

  it("ignores non-finite min/max bounds instead of poisoning the value", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", minValue: Number.NaN, maxValue: Number.POSITIVE_INFINITY })
    );
    act(() => result.current.setInputValue("42"));
    act(() => result.current.commit());
    expect(result.current.numberValue).toBe(42);
  });
});
