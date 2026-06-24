import { describe, it, expect } from "vitest";
import { type } from "../../test-utils.js";
import "../../locales/fa.js";

// Percent fields hold the FRACTION (Intl multiplies by 100 on display), so the
// typed digits are the percentage: typing "50" means 50% i.e. value 0.5.
const pct = (extra: Record<string, unknown> = {}) => ({
  formatOptions: { style: "percent", ...extra } as Intl.NumberFormatOptions,
});

describe("percent — value is the fraction", () => {
  it("typing 50 -> 50% / value 0.5", async () => {
    const r = await type(pct(), "50");
    expect(r.committedDisplay).toBe("50%");
    expect(r.committedValue).toBe(0.5);
  });

  it("typing 12 -> 12% / value 0.12", async () => {
    const r = await type(pct(), "12");
    expect(r.committedDisplay).toBe("12%");
    expect(r.committedValue).toBeCloseTo(0.12, 10);
  });

  it("percent composes with grouping: 1000 -> 1,000% / value 10", async () => {
    const r = await type(pct(), "1000");
    expect(r.committedDisplay).toBe("1,000%");
    expect(r.committedValue).toBe(10);
  });

  it("negative percent: -25 -> value -0.25", async () => {
    const r = await type(pct({ maximumFractionDigits: 2 }), "-25");
    expect(r.committedValue).toBe(-0.25);
    expect(r.committedDisplay).toMatch(/25%/);
  });
});

describe("percent — typing decimals does not corrupt the value", () => {
  // Regression: the live formatter once rounded the typed fraction away ("12.5"
  // -> "13%") and the shorter string corrupted the next keystroke ("12.55" -> 135%).
  it("default percent keeps the typed fraction LIVE then rounds to scale on blur", async () => {
    const r = await type(pct(), "12.99");
    expect(r.liveDisplay).toBe("12.99%"); // no float tail, no 12.990000000002%
    // default maximumFractionDigits is 0, so commit legitimately rounds to 13%
    expect(r.committedDisplay).toBe("13%");
    expect(r.committedValue).toBeCloseTo(0.13, 10);
  });

  it("maximumFractionDigits:2 commits the exact fraction with NO IEEE float tail", async () => {
    const r = await type(pct({ maximumFractionDigits: 2 }), "12.55");
    expect(r.liveDisplay).toBe("12.55%");
    expect(r.committedValue).toBe(0.1255);
    expect(String(r.committedValue)).toBe("0.1255"); // snapped, not 0.12550000000000003
  });

  it("12.99 with maxFrac 2 -> exactly 0.1299 (no float tail)", async () => {
    const r = await type(pct({ maximumFractionDigits: 2 }), "12.99");
    expect(String(r.committedValue)).toBe("0.1299");
  });

  it("33.33 with maxFrac 2 -> exactly 0.3333 (no float tail)", async () => {
    const r = await type(pct({ maximumFractionDigits: 2 }), "33.33");
    expect(String(r.committedValue)).toBe("0.3333");
  });

  it("retyping a committed percent is idempotent (no explosion)", async () => {
    // "12.55%" already on screen, replace it by typing the same digits again.
    const r = await type(pct({ maximumFractionDigits: 2 }), "12.55");
    expect(r.committedValue).toBe(0.1255);
    expect(r.committedDisplay).toBe("12.55%");
  });
});

describe("percent — i18n", () => {
  it("de-DE: the comma is the decimal, 12,99 -> 0.1299 (not 1.299)", async () => {
    const r = await type(
      { locale: "de-DE", ...pct({ maximumFractionDigits: 2 }) },
      "12,99"
    );
    expect(r.committedValue).toBeCloseTo(0.1299, 10);
    expect(r.committedValue).not.toBeCloseTo(1.299, 3);
  });

  it("fa-IR: native digits typed into a percent field round-trip", async () => {
    const r = await type({ locale: "fa-IR", ...pct({ maximumFractionDigits: 2 }) }, "۵۰");
    expect(r.committedValue).toBe(0.5);
  });
});
