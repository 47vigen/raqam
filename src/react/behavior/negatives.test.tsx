import { describe, it, expect } from "vitest";
import { type, renderField, norm } from "../../test-utils.js";
// Native-digit / U+2212 locales need their plugin registered before use.
import "../../locales/fa.js";

describe("negatives — entering and editing negative numbers", () => {
  it("a lone minus is intermediate while typing and clears on blur", async () => {
    const r = await type({}, "-");
    // While focused the lone "-" has no numeric value.
    expect(r.liveValue).toBe(null);
    // On blur the intermediate minus is discarded — empty display, no value.
    expect(r.committedValue).toBe(null);
    expect(r.committedDisplay).toBe("");
  });

  it("typing -5 commits the value -5", async () => {
    const r = await type({}, "-5");
    expect(r.liveValue).toBe(-5);
    expect(r.committedValue).toBe(-5);
    expect(norm(r.committedDisplay)).toBe("-5");
  });

  it("typing -1.5 commits the value -1.5 with the decimal preserved", async () => {
    const r = await type({}, "-1.5");
    expect(r.committedValue).toBeCloseTo(-1.5, 10);
    expect(norm(r.committedDisplay)).toBe("-1.5");
  });

  it("typing -1234.5 groups the display and commits -1234.5", async () => {
    const r = await type({}, "-1234.5");
    expect(r.committedValue).toBeCloseTo(-1234.5, 10);
    expect(norm(r.committedDisplay)).toBe("-1,234.5");
  });

  it("prepending a minus to an existing positive turns it negative", async () => {
    // Positive default 123; insert "-" at caret 0 to flip the sign.
    const r = await type({ defaultValue: 123 }, "-", { from: 0 });
    expect(r.liveValue).toBe(-123);
    expect(r.committedValue).toBe(-123);
    expect(norm(r.committedDisplay)).toBe("-123");
  });

  it("typing -0 commits 0 (never negative zero) and onChange never emits -0", async () => {
    const r = await type({}, "-0");
    expect(r.committedValue).toBe(0);
    // The committed value must be a true +0, not -0.
    expect(Object.is(r.committedValue, -0)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("0");
    // No -0 ever passed through onChange.
    for (const v of r.changes) {
      expect(Object.is(v, -0)).toBe(false);
    }
  });

  it("typing -0.5 preserves the negative fractional value", async () => {
    const r = await type({}, "-0.5");
    expect(r.committedValue).toBeCloseTo(-0.5, 10);
    expect(Object.is(r.committedValue, -0)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("-0.5");
  });

  it("a doubled leading minus --5 collapses to a single sign (-5)", async () => {
    const r = await type({}, "--5");
    expect(r.committedValue).toBe(-5);
    expect(norm(r.committedDisplay)).toBe("-5");
  });

  it("a minus typed mid-number 1-23 is dropped and the value stays positive", async () => {
    const r = await type({}, "1-23");
    expect(r.committedValue).toBe(123);
    expect(norm(r.committedDisplay)).toBe("123");
  });

  it("allowNegative:false drops the minus so -5 becomes 5", async () => {
    const r = await type({ allowNegative: false }, "-5");
    expect(r.committedValue).toBe(5);
    expect(Object.is(r.committedValue, -5)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("5");
  });

  describe("U+2212 minus locales keep a negative value", () => {
    it("sv-SE keeps -5 negative with a minus glyph in the display", async () => {
      const r = await type({ locale: "sv-SE" }, "-5");
      expect(r.committedValue).toBe(-5);
      expect(r.committedValue! < 0).toBe(true);
      expect(/[-−]/.test(r.committedDisplay)).toBe(true);
    });

    it("fi-FI keeps -5 negative with a minus glyph in the display", async () => {
      const r = await type({ locale: "fi-FI" }, "-5");
      expect(r.committedValue).toBe(-5);
      expect(r.committedValue! < 0).toBe(true);
      expect(/[-−]/.test(r.committedDisplay)).toBe(true);
    });

    it("fa-IR keeps -5 negative with a minus glyph in the display", async () => {
      const r = await type({ locale: "fa-IR" }, "-5");
      expect(r.committedValue).toBe(-5);
      expect(r.committedValue! < 0).toBe(true);
      expect(/[-−]/.test(r.committedDisplay)).toBe(true);
    });
  });
});

// Touch renderField so the harness import stays exercised even if every
// scenario above flows through type(); guards against accidental dead imports.
describe("negatives — harness sanity", () => {
  it("renderField mounts a field with no initial value", () => {
    const h = renderField({});
    expect(h.value()).toBe(null);
    expect(h.display()).toBe("");
  });
});
