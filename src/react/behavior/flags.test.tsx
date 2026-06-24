import { describe, it, expect } from "vitest";
import { type, paste, renderField, norm } from "../../test-utils.js";

/**
 * Constraint-flag behavior. Each case drives the real keystroke / paste
 * pipeline via the shared harness and asserts BOTH the display string and the
 * numeric value, live (pre-blur) where the live experience matters, and
 * committed (post-blur). The source is correct — green means correct.
 */

describe("allowDecimal:false drops the decimal point", () => {
  it('typing "12.5" ignores the dot and commits the integer 125', async () => {
    const r = await type({ allowDecimal: false }, "12.5");
    expect(r.liveDisplay).toBe("125");
    expect(r.liveValue).toBe(125);
    expect(r.committedDisplay).toBe("125");
    expect(r.committedDisplay).not.toContain(".");
    expect(r.committedValue).toBe(125);
  });

  it('typing "1.0.0" collapses to the integer 100', async () => {
    const r = await type({ allowDecimal: false }, "1.0.0");
    expect(r.committedDisplay).toBe("100");
    expect(r.committedDisplay).not.toContain(".");
    expect(r.committedValue).toBe(100);
  });

  it('pasting "1.5" strips the dot and commits 15', async () => {
    const r = await paste({ allowDecimal: false }, "1.5");
    expect(r.committedDisplay).toBe("15");
    expect(r.committedDisplay).not.toContain(".");
    expect(r.committedValue).toBe(15);
  });
});

describe("allowNegative:false drops the minus sign", () => {
  it('typing "-5" ignores the minus and commits 5', async () => {
    const r = await type({ allowNegative: false }, "-5");
    expect(r.liveDisplay).toBe("5");
    expect(r.liveValue).toBe(5);
    expect(r.committedDisplay).toBe("5");
    expect(r.committedDisplay).not.toContain("-");
    expect(r.committedValue).toBe(5);
  });

  it('pasting "-42" strips the minus and commits 42', async () => {
    const r = await paste({ allowNegative: false }, "-42");
    expect(r.committedDisplay).toBe("42");
    expect(r.committedDisplay).not.toContain("-");
    expect(r.committedValue).toBe(42);
  });

  it('typing "-1.5" drops only the minus, keeping the decimal value 1.5', async () => {
    const r = await type({ allowNegative: false }, "-1.5");
    expect(r.committedDisplay).toBe("1.5");
    expect(r.committedDisplay).not.toContain("-");
    expect(r.committedValue).toBe(1.5);
  });
});

describe("fixedDecimalScale pads to maximumFractionDigits on commit", () => {
  const FIXED2 = { fixedDecimalScale: true, maximumFractionDigits: 2 } as const;

  it('typing "1.5" stays "1.5" live but commits padded to "1.50" (value 1.5)', async () => {
    const r = await type(FIXED2, "1.5");
    expect(r.liveDisplay).toBe("1.5");
    expect(r.liveValue).toBe(1.5);
    expect(r.committedDisplay).toBe("1.50");
    expect(r.committedValue).toBe(1.5);
  });

  it('typing "1.500" clamps the scale to "1.50" (value 1.5)', async () => {
    const r = await type(FIXED2, "1.500");
    expect(r.committedDisplay).toBe("1.50");
    expect(r.committedValue).toBe(1.5);
  });

  it('typing a bare integer "7" commits padded to "7.00" (value 7)', async () => {
    const r = await type(FIXED2, "7");
    expect(r.liveDisplay).toBe("7");
    expect(r.liveValue).toBe(7);
    expect(r.committedDisplay).toBe("7.00");
    expect(r.committedValue).toBe(7);
  });
});

describe("prefix + suffix wrap the editable number cleanly", () => {
  const WRAP = { prefix: "$", suffix: " kg" } as const;

  it('typing "1234" shows "$1,234 kg" live and commits the same with value 1234', async () => {
    const r = await type(WRAP, "1234");
    expect(norm(r.liveDisplay)).toBe("$1,234 kg");
    expect(r.liveValue).toBe(1234);
    expect(norm(r.committedDisplay)).toBe("$1,234 kg");
    expect(r.committedValue).toBe(1234);
  });

  it('typing a decimal "12.5" keeps the affixes and commits value 12.5', async () => {
    const r = await type(WRAP, "12.5");
    expect(norm(r.committedDisplay)).toBe("$12.5 kg");
    expect(r.committedValue).toBe(12.5);
  });

  it("an empty field renders no stranded prefix or suffix", async () => {
    const h = renderField(WRAP);
    expect(h.display()).toBe("");
    expect(h.value()).toBe(null);
    await h.user.click(h.input);
    await h.user.tab();
    expect(h.display()).toBe("");
    expect(h.value()).toBe(null);
  });
});

describe("allowOutOfRange keeps the value but flags it invalid", () => {
  const RANGE = { minValue: 0, maxValue: 100, allowOutOfRange: true } as const;

  it('typing "150" above max keeps committed value 150 and sets aria-invalid', async () => {
    const r = await type(RANGE, "150");
    expect(r.liveValue).toBe(150);
    expect(r.committedDisplay).toBe("150");
    expect(r.committedValue).toBe(150);
    expect(r.h.input.getAttribute("aria-invalid")).toBe("true");
  });

  it('an in-range value "50" is committed without aria-invalid', async () => {
    const r = await type(RANGE, "50");
    expect(r.committedValue).toBe(50);
    expect(r.h.input.getAttribute("aria-invalid")).toBe(null);
  });
});

describe('clampBehavior "strict" rejects keystrokes that exceed max', () => {
  const STRICT = { maxValue: 100, clampBehavior: "strict" } as const;

  it('typing "150" stops at "15" because the digit pushing past max is rejected', async () => {
    const r = await type(STRICT, "150");
    expect(r.liveDisplay).toBe("15");
    expect(r.liveValue).toBe(15);
    expect(r.committedDisplay).toBe("15");
    expect(r.committedValue).toBe(15);
  });

  it('typing exactly the max "100" is accepted', async () => {
    const r = await type(STRICT, "100");
    expect(r.liveDisplay).toBe("100");
    expect(r.liveValue).toBe(100);
    expect(r.committedDisplay).toBe("100");
    expect(r.committedValue).toBe(100);
  });
});
