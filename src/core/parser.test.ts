import { describe, it, expect } from "vitest";
import { createParser } from "./parser.js";

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
