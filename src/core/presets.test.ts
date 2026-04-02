import { describe, it, expect } from "vitest";
import { presets } from "./presets.js";

describe("presets", () => {
  describe("currency", () => {
    it("returns correct style and currency", () => {
      expect(presets.currency("USD")).toEqual({ style: "currency", currency: "USD" });
      expect(presets.currency("EUR")).toEqual({ style: "currency", currency: "EUR" });
    });

    it("works with Intl.NumberFormat", () => {
      const opts = presets.currency("USD");
      const fmt = new Intl.NumberFormat("en-US", opts);
      expect(fmt.format(1234.56)).toBe("$1,234.56");
    });
  });

  describe("accounting", () => {
    it("returns correct style, currency, and currencySign", () => {
      expect(presets.accounting("USD")).toEqual({
        style: "currency",
        currency: "USD",
        currencySign: "accounting",
      });
    });

    it("formats negatives as parentheses", () => {
      const opts = presets.accounting("USD");
      const fmt = new Intl.NumberFormat("en-US", opts);
      // Accounting format wraps negatives in parentheses
      const neg = fmt.format(-1234.56);
      expect(neg).toMatch(/\(.*1,234\.56.*\)/);
    });
  });

  describe("percent", () => {
    it("has correct style", () => {
      expect(presets.percent).toEqual({ style: "percent" });
    });

    it("formats 0.42 as '42%'", () => {
      const fmt = new Intl.NumberFormat("en-US", presets.percent);
      expect(fmt.format(0.42)).toBe("42%");
    });
  });

  describe("compact", () => {
    it("has notation: compact", () => {
      expect(presets.compact).toEqual({ notation: "compact" });
    });

    it("formats large numbers compactly", () => {
      const fmt = new Intl.NumberFormat("en-US", presets.compact);
      expect(fmt.format(1200)).toBe("1.2K");
    });
  });

  describe("compactLong", () => {
    it("has notation: compact and compactDisplay: long", () => {
      expect(presets.compactLong).toEqual({
        notation: "compact",
        compactDisplay: "long",
      });
    });
  });

  describe("scientific", () => {
    it("has notation: scientific", () => {
      expect(presets.scientific).toEqual({ notation: "scientific" });
    });

    it("formats with exponent", () => {
      const fmt = new Intl.NumberFormat("en-US", presets.scientific);
      expect(fmt.format(1234)).toMatch(/E/i);
    });
  });

  describe("engineering", () => {
    it("has notation: engineering", () => {
      expect(presets.engineering).toEqual({ notation: "engineering" });
    });
  });

  describe("integer", () => {
    it("has maximumFractionDigits: 0", () => {
      expect(presets.integer).toEqual({ maximumFractionDigits: 0 });
    });

    it("formats without decimal places", () => {
      const fmt = new Intl.NumberFormat("en-US", presets.integer);
      expect(fmt.format(3.7)).toBe("4");
    });
  });

  describe("financial", () => {
    it("has 2 minimum and maximum fraction digits", () => {
      expect(presets.financial).toEqual({
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    it("always shows 2 decimal places", () => {
      const fmt = new Intl.NumberFormat("en-US", presets.financial);
      expect(fmt.format(1234)).toBe("1,234.00");
      expect(fmt.format(1234.1)).toBe("1,234.10");
    });
  });

  describe("unit", () => {
    it("returns correct style and unit", () => {
      expect(presets.unit("kilometer")).toEqual({
        style: "unit",
        unit: "kilometer",
      });
    });

    it("works with Intl.NumberFormat", () => {
      const opts = presets.unit("kilometer");
      const fmt = new Intl.NumberFormat("en-US", opts);
      expect(fmt.format(42)).toContain("42");
    });
  });
});
