import { describe, it, expect } from "vitest";
import { normalizeDigits, isNonLatinDigit, registerLocale } from "./normalizer.js";

describe("normalizeDigits", () => {
  it("passes ASCII digits through unchanged", () => {
    expect(normalizeDigits("1234567890")).toBe("1234567890");
  });

  it("converts Persian (Extended Arabic-Indic) digits", () => {
    expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
  });

  it("converts Arabic-Indic digits", () => {
    expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("converts Devanagari digits", () => {
    expect(normalizeDigits("०१२३४५६७८९")).toBe("0123456789");
  });

  it("converts Bengali digits", () => {
    expect(normalizeDigits("০১২৩৪৫৬৭৮৯")).toBe("0123456789");
  });

  it("converts Thai digits", () => {
    expect(normalizeDigits("๐๑๒๓๔๕๖๗๘๙")).toBe("0123456789");
  });

  it("preserves non-digit characters", () => {
    expect(normalizeDigits("$1,234.56")).toBe("$1,234.56");
  });

  it("handles mixed non-Latin and ASCII in a real fa-IR number", () => {
    // ۱٬۲۳۴٫۵۶ — Persian digits with locale separators
    const result = normalizeDigits("۱٬۲۳۴٫۵۶");
    // digits should be ASCII, separators preserved
    expect(result).toBe("1٬234٫56");
  });

  it("handles empty string", () => {
    expect(normalizeDigits("")).toBe("");
  });

  it("handles lone minus sign", () => {
    expect(normalizeDigits("-")).toBe("-");
  });

  it("handles mixed Persian and ASCII", () => {
    expect(normalizeDigits("۱2۳")).toBe("123");
  });
});

describe("isNonLatinDigit", () => {
  it("returns false for ASCII digits", () => {
    expect(isNonLatinDigit("5")).toBe(false);
    expect(isNonLatinDigit("0")).toBe(false);
  });

  it("returns true for Persian digit", () => {
    expect(isNonLatinDigit("۵")).toBe(true);
  });

  it("returns true for Arabic-Indic digit", () => {
    expect(isNonLatinDigit("٥")).toBe(true);
  });

  it("returns false for letters", () => {
    expect(isNonLatinDigit("a")).toBe(false);
    expect(isNonLatinDigit("ض")).toBe(false);
  });
});

describe("registerLocale", () => {
  it("accepts additional digit blocks without duplicating", () => {
    // Already registered — should not throw or duplicate
    registerLocale({ digitBlocks: [[0x06f0, 0x06f9]] });
    expect(normalizeDigits("۵")).toBe("5");
  });

  it("adds genuinely new blocks", () => {
    // Register a fake range (Fullwidth digits U+FF10–U+FF19) as a test
    registerLocale({ digitBlocks: [[0xff10, 0xff19]] });
    expect(normalizeDigits("\uff15")).toBe("5"); // ５ → 5
  });
});
