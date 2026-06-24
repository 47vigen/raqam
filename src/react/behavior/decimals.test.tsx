import { describe, it, expect } from "vitest";
import { type, norm } from "../../test-utils.js";

/**
 * Decimal typing behavior. Every case drives the real keystroke pipeline via the
 * shared harness and asserts BOTH the display string and the numeric value, live
 * (pre-blur) where the live experience matters, and committed (post-blur).
 */
describe("decimal typing", () => {
  describe("basic decimals keep their exact value", () => {
    it('typing "1.5" yields value 1.5', async () => {
      const r = await type({}, "1.5");
      expect(r.liveDisplay).toBe("1.5");
      expect(r.liveValue).toBe(1.5);
      expect(r.committedDisplay).toBe("1.5");
      expect(r.committedValue).toBe(1.5);
    });

    it('typing "0.5" yields value 0.5', async () => {
      const r = await type({}, "0.5");
      expect(r.liveDisplay).toBe("0.5");
      expect(r.liveValue).toBe(0.5);
      expect(r.committedDisplay).toBe("0.5");
      expect(r.committedValue).toBe(0.5);
    });

    it('typing "12.34" yields value 12.34', async () => {
      const r = await type({}, "12.34");
      expect(r.liveDisplay).toBe("12.34");
      expect(r.liveValue).toBe(12.34);
      expect(r.committedDisplay).toBe("12.34");
      expect(r.committedValue).toBe(12.34);
    });
  });

  describe("decimals survive the grouping threshold (C1 regression)", () => {
    it('below 1000: "12.34" keeps both digits with no comma', async () => {
      const r = await type({}, "12.34");
      expect(r.liveDisplay).toBe("12.34");
      expect(r.committedValue).toBe(12.34);
    });

    it('at the boundary: "1234.56" groups live as "1,234.56" and keeps decimals', async () => {
      const r = await type({}, "1234.56");
      expect(norm(r.liveDisplay)).toBe("1,234.56");
      expect(r.liveValue).toBe(1234.56);
      expect(norm(r.committedDisplay)).toBe("1,234.56");
      expect(r.committedValue).toBe(1234.56);
    });

    it('exactly 1000: "1000.25" groups to "1,000.25" with decimals intact', async () => {
      const r = await type({}, "1000.25");
      expect(norm(r.liveDisplay)).toBe("1,000.25");
      expect(r.liveValue).toBe(1000.25);
      expect(norm(r.committedDisplay)).toBe("1,000.25");
      expect(r.committedValue).toBe(1000.25);
    });

    it('millions: "1234567.89" groups to "1,234,567.89" without swallowing decimals', async () => {
      const r = await type({}, "1234567.89");
      expect(norm(r.liveDisplay)).toBe("1,234,567.89");
      expect(r.liveValue).toBe(1234567.89);
      expect(norm(r.committedDisplay)).toBe("1,234,567.89");
      expect(r.committedValue).toBe(1234567.89);
    });
  });

  describe("trailing-zero decimals stay live and survive blur", () => {
    it('"1.50" keeps the zero live, commits to 1.5 (display not wiped)', async () => {
      const r = await type({}, "1.50");
      expect(r.liveDisplay).toBe("1.50");
      expect(r.liveValue).toBe(1.5);
      expect(r.committedDisplay).toBe("1.5");
      expect(r.committedDisplay).not.toBe("");
      expect(r.committedValue).toBe(1.5);
    });

    it('"1.00" keeps the zeros live, commits to 1 (display not wiped)', async () => {
      const r = await type({}, "1.00");
      expect(r.liveDisplay).toBe("1.00");
      expect(r.liveValue).toBe(1);
      expect(r.committedDisplay).toBe("1");
      expect(r.committedDisplay).not.toBe("");
      expect(r.committedValue).toBe(1);
    });

    it('"19.90" keeps the zero live, commits to 19.9 (display not wiped)', async () => {
      const r = await type({}, "19.90");
      expect(r.liveDisplay).toBe("19.90");
      expect(r.liveValue).toBe(19.9);
      expect(r.committedDisplay).toBe("19.9");
      expect(r.committedDisplay).not.toBe("");
      expect(r.committedValue).toBe(19.9);
    });

    it('"100.10" keeps the zero live, commits to 100.1 (display not wiped)', async () => {
      const r = await type({}, "100.10");
      expect(r.liveDisplay).toBe("100.10");
      expect(r.liveValue).toBe(100.1);
      expect(r.committedDisplay).toBe("100.1");
      expect(r.committedDisplay).not.toBe("");
      expect(r.committedValue).toBe(100.1);
    });
  });

  describe("trailing dot", () => {
    it('"1." shows "1." live and commits to "1" with value 1', async () => {
      const r = await type({}, "1.");
      expect(r.liveDisplay).toBe("1.");
      expect(r.liveValue).toBe(1);
      expect(r.committedDisplay).toBe("1");
      expect(r.committedValue).toBe(1);
    });
  });

  describe("leading dot is not transposed", () => {
    it('".5" commits to 0.5', async () => {
      const r = await type({}, ".5");
      expect(r.liveDisplay).toBe(".5");
      expect(r.liveValue).toBe(0.5);
      expect(r.committedDisplay).toBe("0.5");
      expect(r.committedValue).toBe(0.5);
    });

    it('".05" commits to 0.05 (not 0.5)', async () => {
      const r = await type({}, ".05");
      expect(r.committedDisplay).toBe("0.05");
      expect(r.committedValue).toBe(0.05);
    });

    it('".507" commits to 0.507 (not transposed to 0.35)', async () => {
      const r = await type({}, ".507");
      expect(r.committedDisplay).toBe("0.507");
      expect(r.committedValue).toBe(0.507);
    });
  });

  describe("negative decimals", () => {
    it('"-1.5" commits to -1.5', async () => {
      const r = await type({}, "-1.5");
      expect(r.liveDisplay).toBe("-1.5");
      expect(r.liveValue).toBe(-1.5);
      expect(r.committedDisplay).toBe("-1.5");
      expect(r.committedValue).toBe(-1.5);
    });

    it('"-1234.5" groups to "-1,234.5" and keeps the decimal', async () => {
      const r = await type({}, "-1234.5");
      expect(norm(r.liveDisplay)).toBe("-1,234.5");
      expect(r.liveValue).toBe(-1234.5);
      expect(norm(r.committedDisplay)).toBe("-1,234.5");
      expect(r.committedValue).toBe(-1234.5);
    });
  });

  describe("maximumFractionDigits caps the fraction", () => {
    it('maximumFractionDigits:2 rounds "1.234" to 1.23', async () => {
      const r = await type({ maximumFractionDigits: 2 }, "1.234");
      expect(r.liveDisplay).toBe("1.23");
      expect(r.liveValue).toBe(1.23);
      expect(r.committedDisplay).toBe("1.23");
      expect(r.committedValue).toBe(1.23);
    });
  });

  describe("multiple dots collapse to a single decimal", () => {
    it('"1..2" yields one decimal point -> 1.2', async () => {
      const r = await type({}, "1..2");
      expect(r.liveDisplay).toBe("1.2");
      expect(r.committedDisplay).toBe("1.2");
      expect(r.committedValue).toBe(1.2);
    });

    it('"1.2.3" ignores the second dot -> 1.32', async () => {
      const r = await type({}, "1.2.3");
      expect(r.liveDisplay).toBe("1.32");
      expect(r.committedDisplay).toBe("1.32");
      expect(r.committedValue).toBe(1.32);
    });
  });
});
