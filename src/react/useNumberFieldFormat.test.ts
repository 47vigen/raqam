import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNumberFieldFormat } from "./useNumberFieldFormat.js";

describe("useNumberFieldFormat", () => {
  it("formats a number with en-US currency", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(1234567.89, {
        locale: "en-US",
        formatOptions: { style: "currency", currency: "USD" },
      })
    );
    expect(result.current).toBe("$1,234,567.89");
  });

  it("returns empty string for null", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(null, { locale: "en-US" })
    );
    expect(result.current).toBe("");
  });

  it("formats with percent preset", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(0.4267, {
        locale: "en-US",
        formatOptions: { style: "percent", maximumFractionDigits: 1 },
      })
    );
    expect(result.current).toBe("42.7%");
  });

  it("formats de-DE locale", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(1234.56, { locale: "de-DE" })
    );
    // German uses period grouping and comma decimal
    expect(result.current).toBe("1.234,56");
  });

  it("respects fixedDecimalScale", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(1234, {
        locale: "en-US",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        fixedDecimalScale: true,
      })
    );
    expect(result.current).toBe("1,234.00");
  });

  it("applies prefix and suffix", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(1000, {
        locale: "en-US",
        prefix: "~",
        suffix: " pts",
      })
    );
    expect(result.current).toBe("~1,000 pts");
  });

  it("memoizes: same result on re-render with same value", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | null }) =>
        useNumberFieldFormat(value, {
          locale: "en-US",
          formatOptions: { style: "currency", currency: "USD" },
        }),
      { initialProps: { value: 42 } }
    );
    const first = result.current;
    rerender({ value: 42 });
    expect(result.current).toBe(first);
  });

  it("updates when value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | null }) =>
        useNumberFieldFormat(value, {
          locale: "en-US",
          formatOptions: { style: "currency", currency: "USD" },
        }),
      { initialProps: { value: 42 } }
    );
    expect(result.current).toBe("$42.00");
    rerender({ value: 100 });
    expect(result.current).toBe("$100.00");
  });

  it("formats zero", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(0, { locale: "en-US" })
    );
    expect(result.current).toBe("0");
  });

  it("formats negative numbers", () => {
    const { result } = renderHook(() =>
      useNumberFieldFormat(-1234.56, {
        locale: "en-US",
        formatOptions: { style: "currency", currency: "USD" },
      })
    );
    expect(result.current).toBe("-$1,234.56");
  });
});
