import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNumberFieldState } from "./useNumberFieldState.js";

// ── defaultValue — uncontrolled initialization ────────────────────────────────

describe("defaultValue — uncontrolled initialization", () => {
  it("shows formatted integer on mount", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 23456 })
    );
    expect(result.current.inputValue).toBe("23,456");
    expect(result.current.numberValue).toBe(23456);
  });

  it("shows formatted decimal on mount", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 23.58 })
    );
    expect(result.current.inputValue).toBe("23.58");
    expect(result.current.numberValue).toBe(23.58);
  });

  it("shows formatted negative on mount", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: -5 })
    );
    expect(result.current.inputValue).toBe("-5");
    expect(result.current.numberValue).toBe(-5);
  });

  it("shows compact notation on mount", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 1500,
        formatOptions: { notation: "compact" },
      })
    );
    expect(result.current.inputValue).toBe("1.5K");
    expect(result.current.numberValue).toBe(1500);
  });

  it("empty field when no defaultValue", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    expect(result.current.inputValue).toBe("");
    expect(result.current.numberValue).toBeNull();
  });
});

// ── Typing decimals ───────────────────────────────────────────────────────────

describe("Typing decimals", () => {
  it("types 23.58 into empty field", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("23.58"));
    expect(result.current.inputValue).toBe("23.58");
    expect(result.current.numberValue).toBe(23.58);
  });

  it("preserves intermediate '23.' without reformatting", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("23."));
    expect(result.current.inputValue).toBe("23.");
    // numberValue is null for intermediate state
    expect(result.current.numberValue).toBeNull();
  });

  it("continues from intermediate to complete decimal", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("23."));
    act(() => result.current.setInputValue("23.5"));
    act(() => result.current.setInputValue("23.58"));
    expect(result.current.inputValue).toBe("23.58");
    expect(result.current.numberValue).toBe(23.58);
  });

  it("updates field that already contains a value with a decimal", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100 })
    );
    act(() => result.current.setInputValue("23.58"));
    expect(result.current.inputValue).toBe("23.58");
    expect(result.current.numberValue).toBe(23.58);
  });

  it("rejects decimal when allowDecimal is false", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", allowDecimal: false })
    );
    act(() => result.current.setInputValue("23.58"));
    // Parser strips decimal part — numberValue stays null or becomes integer
    expect(result.current.numberValue).not.toBe(23.58);
  });

  it("commit() reformats decimal to locale format", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("1234.56"));
    act(() => result.current.commit());
    expect(result.current.inputValue).toBe("1,234.56");
  });
});

// ── Typing negative numbers ───────────────────────────────────────────────────

describe("Typing negative numbers", () => {
  it("lone '-' is intermediate: numberValue stays null", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("-"));
    expect(result.current.inputValue).toBe("-");
    expect(result.current.numberValue).toBeNull();
  });

  it("types -5", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("-5"));
    expect(result.current.inputValue).toBe("-5");
    expect(result.current.numberValue).toBe(-5);
  });

  it("types -23.58", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("-23.58"));
    expect(result.current.inputValue).toBe("-23.58");
    expect(result.current.numberValue).toBe(-23.58);
  });

  it("updates a field with positive value to negative", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100 })
    );
    act(() => result.current.setInputValue("-5"));
    expect(result.current.numberValue).toBe(-5);
  });

  it("does not produce a negative numberValue when allowNegative is false", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", allowNegative: false })
    );
    // Parser with allowNegative:false should not parse "-5" as a valid negative number
    act(() => result.current.setInputValue("-5"));
    expect(result.current.numberValue).toBeNull();
  });

  it("negative decimal: -0.58 intermediate '-0.'", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US" })
    );
    act(() => result.current.setInputValue("-0."));
    expect(result.current.inputValue).toBe("-0.");
    expect(result.current.numberValue).toBeNull();
  });
});

// ── Compact notation ──────────────────────────────────────────────────────────

describe("Compact notation", () => {
  it("displays 1500 as 1.5K on mount", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 1500,
        formatOptions: { notation: "compact" },
      })
    );
    expect(result.current.inputValue).toBe("1.5K");
    expect(result.current.numberValue).toBe(1500);
  });

  it("displays 1_200_000 as 1.2M on mount", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 1_200_000,
        formatOptions: { notation: "compact" },
      })
    );
    expect(result.current.inputValue).toBe("1.2M");
    expect(result.current.numberValue).toBe(1_200_000);
  });

  it("setNumberValue updates compact display", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        formatOptions: { notation: "compact" },
      })
    );
    act(() => result.current.setNumberValue(2500));
    expect(result.current.inputValue).toBe("2.5K");
    expect(result.current.numberValue).toBe(2500);
  });

  it("commit() reformats to compact", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({
        locale: "en-US",
        defaultValue: 1500,
        formatOptions: { notation: "compact" },
      })
    );
    // Simulate user typing raw number
    act(() => result.current.setInputValue("2500"));
    act(() => result.current.commit());
    expect(result.current.inputValue).toBe("2.5K");
    expect(result.current.numberValue).toBe(2500);
  });
});

// ── Reset field then retype ───────────────────────────────────────────────────

describe("Reset field then retype", () => {
  it("clearing field sets numberValue to null", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 42 })
    );
    act(() => result.current.setInputValue(""));
    expect(result.current.inputValue).toBe("");
    expect(result.current.numberValue).toBeNull();
  });

  it("clear then type integer", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 42 })
    );
    act(() => result.current.setInputValue(""));
    act(() => result.current.setInputValue("99"));
    expect(result.current.inputValue).toBe("99");
    expect(result.current.numberValue).toBe(99);
  });

  it("clear then type decimal 23.58", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 42 })
    );
    act(() => result.current.setInputValue(""));
    act(() => result.current.setInputValue("23.58"));
    expect(result.current.inputValue).toBe("23.58");
    expect(result.current.numberValue).toBe(23.58);
  });

  it("clear then type negative", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 42 })
    );
    act(() => result.current.setInputValue(""));
    act(() => result.current.setInputValue("-5"));
    expect(result.current.numberValue).toBe(-5);
  });

  it("clear fires onChange with null", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 42, onChange })
    );
    act(() => result.current.setInputValue(""));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

// ── Update field containing a value ──────────────────────────────────────────

describe("Update field containing a value", () => {
  it("overwrite 100 with 200", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100 })
    );
    act(() => result.current.setInputValue("200"));
    expect(result.current.numberValue).toBe(200);
  });

  it("overwrite 100 with decimal 23.58", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100 })
    );
    act(() => result.current.setInputValue("23.58"));
    expect(result.current.numberValue).toBe(23.58);
  });

  it("overwrite 100 with negative -50", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100 })
    );
    act(() => result.current.setInputValue("-50"));
    expect(result.current.numberValue).toBe(-50);
  });

  it("clear 100 then type 50", () => {
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100 })
    );
    act(() => result.current.setInputValue(""));
    act(() => result.current.setInputValue("50"));
    expect(result.current.numberValue).toBe(50);
  });

  it("fires onChange on each update", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumberFieldState({ locale: "en-US", defaultValue: 100, onChange })
    );
    act(() => result.current.setInputValue("200"));
    expect(onChange).toHaveBeenCalledWith(200);
    act(() => result.current.setInputValue("300"));
    expect(onChange).toHaveBeenCalledWith(300);
  });
});
