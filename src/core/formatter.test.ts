import { describe, it, expect } from "vitest";
import { createFormatter } from "./formatter.js";

describe("createFormatter", () => {
  describe("format — en-US", () => {
    const fmt = createFormatter({ locale: "en-US" });

    it("formats integer", () => {
      expect(fmt.format(1234)).toBe("1,234");
    });

    it("formats decimal", () => {
      expect(fmt.format(1234.56)).toBe("1,234.56");
    });

    it("formats zero", () => {
      expect(fmt.format(0)).toBe("0");
    });

    it("formats negative", () => {
      expect(fmt.format(-1234.56)).toBe("-1,234.56");
    });

    it("returns empty string for Infinity", () => {
      expect(fmt.format(Infinity)).toBe("");
    });
  });

  describe("format — de-DE", () => {
    const fmt = createFormatter({ locale: "de-DE" });

    it("uses dot grouping and comma decimal", () => {
      expect(fmt.format(1234.56)).toBe("1.234,56");
    });
  });

  describe("format — fr-FR", () => {
    const fmt = createFormatter({ locale: "fr-FR" });

    it("uses narrow no-break space grouping", () => {
      const result = fmt.format(1234.56);
      // Should contain some whitespace-like grouping separator
      expect(result).toMatch(/1.234,56|1\s234,56/);
    });
  });

  describe("format — fa-IR", () => {
    const fmt = createFormatter({ locale: "fa-IR" });

    it("uses Persian digits and locale separators", () => {
      const result = fmt.format(1234.56);
      // Should contain Persian digits
      expect(result).toMatch(/[\u06f0-\u06f9]/);
    });
  });

  describe("getLocaleInfo — en-US", () => {
    const fmt = createFormatter({ locale: "en-US" });
    const info = fmt.getLocaleInfo();

    it("extracts decimal separator", () => {
      expect(info.decimalSeparator).toBe(".");
    });

    it("extracts grouping separator", () => {
      expect(info.groupingSeparator).toBe(",");
    });

    it("detects LTR", () => {
      expect(info.isRTL).toBe(false);
    });
  });

  describe("getLocaleInfo — de-DE", () => {
    const fmt = createFormatter({ locale: "de-DE" });
    const info = fmt.getLocaleInfo();

    it("extracts decimal separator", () => {
      expect(info.decimalSeparator).toBe(",");
    });

    it("extracts grouping separator", () => {
      expect(info.groupingSeparator).toBe(".");
    });
  });

  describe("getLocaleInfo — fa-IR", () => {
    const fmt = createFormatter({ locale: "fa-IR" });
    const info = fmt.getLocaleInfo();

    it("detects RTL", () => {
      expect(info.isRTL).toBe(true);
    });
  });

  describe("prefix and suffix", () => {
    const fmt = createFormatter({ locale: "en-US", prefix: "$", suffix: " USD" });

    it("prepends prefix and appends suffix", () => {
      expect(fmt.format(1234)).toBe("$1,234 USD");
    });
  });

  describe("currency format", () => {
    const fmt = createFormatter({
      locale: "en-US",
      formatOptions: { style: "currency", currency: "USD" },
    });

    it("formats as currency", () => {
      expect(fmt.format(1234.56)).toBe("$1,234.56");
    });
  });

  describe("fixedDecimalScale", () => {
    const fmt = createFormatter({
      locale: "en-US",
      maximumFractionDigits: 2,
      fixedDecimalScale: true,
    });

    it("always shows 2 decimal places", () => {
      expect(fmt.format(1234)).toBe("1,234.00");
      expect(fmt.format(1234.5)).toBe("1,234.50");
    });
  });
});
