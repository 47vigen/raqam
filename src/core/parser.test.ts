import { describe, it, expect } from "vitest";
import { createParser } from "./parser.js";
import { createFormatter } from "./formatter.js";

describe("createParser — en-US", () => {
  const parser = createParser({ locale: "en-US" });

  it("parses plain integer", () => {
    expect(parser.parse("1234").value).toBe(1234);
  });

  it("parses formatted number with grouping separator", () => {
    expect(parser.parse("1,234").value).toBe(1234);
    expect(parser.parse("1,234,567").value).toBe(1234567);
  });

  it("parses decimal", () => {
    expect(parser.parse("1,234.56").value).toBe(1234.56);
  });

  it("parses negative", () => {
    expect(parser.parse("-1,234.56").value).toBe(-1234.56);
  });

  it("parses zero", () => {
    expect(parser.parse("0").value).toBe(0);
  });

  it("returns null for empty string", () => {
    const r = parser.parse("");
    expect(r.value).toBeNull();
    expect(r.isValid).toBe(false);
  });

  it("returns null for garbage input", () => {
    expect(parser.parse("abc").value).toBeNull();
  });

  it("identifies intermediate: lone minus", () => {
    const r = parser.parse("-");
    expect(r.isIntermediate).toBe(true);
    expect(r.value).toBeNull();
  });

  it("identifies intermediate: trailing decimal", () => {
    const r = parser.parse("1.");
    expect(r.isIntermediate).toBe(true);
  });

  it("identifies intermediate: trailing zero", () => {
    const r = parser.parse("1.0");
    expect(r.isIntermediate).toBe(true);
  });

  it("identifies intermediate: trailing zeros", () => {
    expect(parser.parse("1.00").isIntermediate).toBe(true);
    expect(parser.parse("1.10").isIntermediate).toBe(true);
  });

  it("does NOT mark valid complete decimals as intermediate", () => {
    expect(parser.parse("1.5").isIntermediate).toBe(false);
    expect(parser.parse("1.5").value).toBe(1.5);
  });
});

describe("createParser — de-DE", () => {
  const parser = createParser({ locale: "de-DE" });

  it("parses de-DE formatted number", () => {
    expect(parser.parse("1.234,56").value).toBe(1234.56);
  });

  it("treats ',' as decimal separator", () => {
    expect(parser.parse("3,14").value).toBe(3.14);
  });

  it("identifies intermediate: trailing de-DE decimal", () => {
    expect(parser.parse("1,").isIntermediate).toBe(true);
  });
});

describe("createParser — fa-IR with Persian digits", () => {
  const parser = createParser({ locale: "fa-IR" });

  it("parses Persian digit string", () => {
    const r = parser.parse("۱۲۳۴");
    expect(r.value).toBe(1234);
  });

  it("parses Persian formatted number", () => {
    // ۱٬۲۳۴٫۵۶ — Persian digits, locale separators
    const r = parser.parse("۱٬۲۳۴٫۵۶");
    expect(r.value).toBe(1234.56);
  });
});

describe("createParser — allowNegative: false", () => {
  const parser = createParser({ locale: "en-US", allowNegative: false });

  it("rejects negative numbers", () => {
    expect(parser.parse("-5").isValid).toBe(false);
  });

  it("does NOT treat '-' as intermediate", () => {
    expect(parser.parse("-").isIntermediate).toBe(false);
  });
});

describe("createParser — allowDecimal: false", () => {
  const parser = createParser({ locale: "en-US", allowDecimal: false });

  it("rejects decimal numbers", () => {
    expect(parser.parse("1.5").isValid).toBe(false);
  });

  it("does NOT treat '1.' as intermediate", () => {
    expect(parser.parse("1.").isIntermediate).toBe(false);
  });
});

describe("createParser — prefix/suffix", () => {
  const parser = createParser({ locale: "en-US", prefix: "$", suffix: " USD" });

  it("strips prefix and suffix before parsing", () => {
    expect(parser.parse("$1,234.56 USD").value).toBe(1234.56);
  });
});

describe("createParser — accounting format (parentheses = negative)", () => {
  const parser = createParser({
    locale: "en-US",
    formatOptions: { style: "currency", currency: "USD", currencySign: "accounting" },
  });

  it("parses (1,234.56) as -1234.56", () => {
    expect(parser.parse("($1,234.56)").value).toBe(-1234.56);
  });

  it("parses (1,234) as -1234", () => {
    expect(parser.parse("($1,234)").value).toBe(-1234);
  });

  it("parses positive value normally", () => {
    expect(parser.parse("$1,234.56").value).toBe(1234.56);
  });

  it("round-trips: format then parse returns original value", () => {
    const fmt = createFormatter({
      locale: "en-US",
      formatOptions: { style: "currency", currency: "USD", currencySign: "accounting" },
    });
    const formatted = fmt.format(-1234.56);
    expect(parser.parse(formatted).value).toBe(-1234.56);
  });
});

describe("createParser — ReDoS / input length cap", () => {
  const parser = createParser({ locale: "en-US" });

  it("rejects inputs longer than 256 chars", () => {
    expect(parser.parse("9".repeat(300))).toEqual({
      value: null,
      isValid: false,
      isIntermediate: false,
    });
  });

  it("rejects a long pathological multi-dot string and stays fast", () => {
    const pathological = "9".repeat(50000) + "." + "9".repeat(50000) + ".";
    const start = Date.now();
    const r = parser.parse(pathological);
    expect(r.value).toBeNull();
    expect(r.isValid).toBe(false);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it("still parses a normal ≤256-char number", () => {
    expect(Number.isFinite(parser.parse("9".repeat(40)).value as number)).toBe(true);
  });
});

describe("createParser — RTL accounting sign (bidi-mark fix)", () => {
  const opts = {
    locale: "fa-IR",
    formatOptions: {
      style: "currency" as const,
      currency: "IRR",
      currencySign: "accounting" as const,
    },
  };
  const parser = createParser(opts);
  const fmt = createFormatter(opts);

  it("preserves the negative sign through a format/parse round-trip", () => {
    expect(parser.parse(fmt.format(-1234)).value).toBe(-1234);
  });

  it("round-trips a positive value", () => {
    expect(parser.parse(fmt.format(1234)).value).toBe(1234);
  });
});

describe("createParser — scientific notation", () => {
  const parser = createParser({ locale: "en-US" });

  it("parses uppercase exponent", () => {
    expect(parser.parse("1.234E3").value).toBe(1234);
  });

  it("parses integer mantissa exponent", () => {
    expect(parser.parse("1e3").value).toBe(1000);
  });

  it("parses negative exponent", () => {
    expect(parser.parse("1.5e-3").value).toBe(0.0015);
  });

  it("round-trips a scientific-notation formatted value", () => {
    const fmt = createFormatter({ locale: "en-US", formatOptions: { notation: "scientific" } });
    expect(parser.parse(fmt.format(1234)).value).toBe(1234);
  });

  it("rejects a fractional exponent value when decimals are disallowed", () => {
    const p = createParser({ locale: "en-US", allowDecimal: false });
    expect(p.parse("5e-1").value).toBeNull(); // 0.5 is fractional → rejected
    expect(p.parse("1e-3").value).toBeNull(); // 0.001 is fractional → rejected
    expect(p.parse("1e3").value).toBe(1000); // integer → allowed
  });

  it("rejects malformed exponents instead of mis-parsing them as the mantissa", () => {
    const p = createParser({ locale: "en-US" });
    // Previously these char-stripped the "e" and silently became 1.
    expect(p.parse("1e+").value).toBeNull();
    expect(p.parse("1efoo").value).toBeNull();
    expect(p.parse("1e").value).toBeNull();
    expect(p.parse("1e2e3").value).toBeNull();
    // The well-formed form still parses.
    expect(p.parse("1e3").value).toBe(1000);
  });
});
