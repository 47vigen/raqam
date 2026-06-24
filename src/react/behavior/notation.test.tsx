import { describe, it, expect } from "vitest";
import { type, paste, renderField, norm } from "../../test-utils.js";

// Notation behavior: compact / scientific / engineering / unit.
// While typing the field shows the RAW digits the user enters; on blur it
// reformats into the chosen notation while the NUMERIC value stays the real
// magnitude. Pasting an already-formatted notation string must recover the
// same magnitude.

describe("compact notation", () => {
  it("typing 2500 stays raw while focused then commits to 2.5K with value 2500", async () => {
    const r = await type({ formatOptions: { notation: "compact" } }, "2500");
    expect(r.liveDisplay).toBe("2500");
    expect(r.liveValue).toBe(2500);
    expect(norm(r.committedDisplay)).toBe("2.5K");
    expect(r.committedValue).toBe(2500);
  });

  it("typing 3400000 commits to 3.4M with value 3400000", async () => {
    const r = await type({ formatOptions: { notation: "compact" } }, "3400000");
    expect(r.liveDisplay).toBe("3400000");
    expect(r.liveValue).toBe(3400000);
    expect(norm(r.committedDisplay)).toBe("3.4M");
    expect(r.committedValue).toBe(3400000);
  });

  it("mounting with a compact defaultValue shows 1.5K", () => {
    const h = renderField({ formatOptions: { notation: "compact" }, defaultValue: 1500 });
    expect(norm(h.display())).toBe("1.5K");
    expect(h.value()).toBe(1500);
  });
});

describe("scientific notation", () => {
  it("typing 1500 commits to 1.5E3 with value 1500", async () => {
    const r = await type({ formatOptions: { notation: "scientific" } }, "1500");
    expect(r.liveDisplay).toBe("1500");
    expect(r.liveValue).toBe(1500);
    expect(norm(r.committedDisplay)).toBe("1.5E3");
    expect(r.committedValue).toBe(1500);
  });
});

describe("engineering notation", () => {
  it("typing 45000 commits to 45E3 with value 45000", async () => {
    const r = await type({ formatOptions: { notation: "engineering" } }, "45000");
    expect(r.liveDisplay).toBe("45000");
    expect(r.liveValue).toBe(45000);
    expect(norm(r.committedDisplay)).toBe("45E3");
    expect(r.committedValue).toBe(45000);
  });
});

describe("unit notation (km/h)", () => {
  it("typing 60 keeps value 60 and shows the unit live and on blur", async () => {
    const r = await type(
      { formatOptions: { style: "unit", unit: "kilometer-per-hour" } },
      "60"
    );
    expect(r.liveValue).toBe(60);
    expect(norm(r.liveDisplay)).toContain("60 km/h");
    expect(r.committedValue).toBe(60);
    expect(norm(r.committedDisplay)).toContain("60 km/h");
  });
});

describe("pasting a formatted notation string keeps magnitude", () => {
  it("paste 2.5K into a compact field yields value 2500", async () => {
    const r = await paste({ formatOptions: { notation: "compact" } }, "2.5K");
    expect(r.committedValue).toBe(2500);
    expect(norm(r.committedDisplay)).toBe("2.5K");
  });

  it("paste 1.5e3 into a scientific field yields value 1500", async () => {
    const r = await paste({ formatOptions: { notation: "scientific" } }, "1.5e3");
    expect(r.committedValue).toBe(1500);
    expect(norm(r.committedDisplay)).toBe("1.5E3");
  });

  it("paste 1.23E4 into a scientific field yields value 12300", async () => {
    const r = await paste({ formatOptions: { notation: "scientific" } }, "1.23E4");
    expect(r.committedValue).toBe(12300);
    expect(norm(r.committedDisplay)).toBe("1.23E4");
  });
});
