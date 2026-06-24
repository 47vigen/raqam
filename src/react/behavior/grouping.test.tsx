import { describe, it, expect } from "vitest";
import { type, paste, renderField, norm } from "../../test-utils.js";

// Grouping behavior: live thousands separators while typing, exact numeric
// value through 15-digit integers, and correct regrouping + caret placement
// when a digit insert crosses a grouping threshold mid-string.

describe("grouping", () => {
  // ── live grouping appears at 1000+ ───────────────────────────────────────
  it("does not group below the thousands threshold (999 stays plain)", async () => {
    const r = await type({}, "999");
    expect(r.liveDisplay).toBe("999");
    expect(r.liveValue).toBe(999);
    expect(r.committedDisplay).toBe("999");
    expect(r.committedValue).toBe(999);
  });

  it("inserts a grouping separator the moment a 4th digit is typed (1000 -> 1,000)", async () => {
    const r = await type({}, "1000");
    expect(r.liveDisplay).toBe("1,000");
    expect(r.liveValue).toBe(1000);
    expect(r.committedDisplay).toBe("1,000");
    expect(r.committedValue).toBe(1000);
  });

  it("groups a seven-digit integer into millions live (1234567 -> 1,234,567)", async () => {
    const r = await type({}, "1234567");
    expect(r.liveDisplay).toBe("1,234,567");
    expect(r.liveValue).toBe(1234567);
    expect(r.committedDisplay).toBe("1,234,567");
    expect(r.committedValue).toBe(1234567);
  });

  // ── appending digits across thresholds regroups continuously ─────────────
  it("regroups a five-digit append into ten-thousands (12345 -> 12,345)", async () => {
    const r = await type({}, "12345");
    expect(r.liveDisplay).toBe("12,345");
    expect(r.liveValue).toBe(12345);
    expect(r.committedDisplay).toBe("12,345");
    expect(r.committedValue).toBe(12345);
  });

  it("regroups a six-digit append into hundred-thousands (123456 -> 123,456)", async () => {
    const r = await type({}, "123456");
    expect(r.liveDisplay).toBe("123,456");
    expect(r.liveValue).toBe(123456);
    expect(r.committedDisplay).toBe("123,456");
    expect(r.committedValue).toBe(123456);
  });

  it("re-anchors group boundaries when appending pushes into the next magnitude (999 -> 9,999)", async () => {
    const r = await type({}, "9999");
    expect(r.liveDisplay).toBe("9,999");
    expect(r.liveValue).toBe(9999);
    expect(r.committedDisplay).toBe("9,999");
    expect(r.committedValue).toBe(9999);
  });

  // ── typed value exact for 15-digit integers ──────────────────────────────
  it("keeps the numeric value exact for a 15-digit integer", async () => {
    const r = await type({}, "123456789012345");
    expect(r.liveDisplay).toBe("123,456,789,012,345");
    expect(r.liveValue).toBe(123456789012345);
    expect(r.committedDisplay).toBe("123,456,789,012,345");
    expect(r.committedValue).toBe(123456789012345);
  });

  it("keeps an all-nines 15-digit integer exact (no float drift)", async () => {
    const r = await type({}, "999999999999999");
    expect(r.committedDisplay).toBe("999,999,999,999,999");
    expect(r.committedValue).toBe(999999999999999);
  });

  // ── leading zeros collapse to the real value ─────────────────────────────
  it("collapses leading zeros to the bare integer (007 -> 7)", async () => {
    const r = await type({}, "007");
    expect(r.liveDisplay).toBe("7");
    expect(r.liveValue).toBe(7);
    expect(r.committedDisplay).toBe("7");
    expect(r.committedValue).toBe(7);
  });

  it("collapses leading zeros before a threshold-crossing run (0001000 -> 1,000)", async () => {
    const r = await type({}, "0001000");
    expect(r.liveDisplay).toBe("1,000");
    expect(r.liveValue).toBe(1000);
    expect(r.committedDisplay).toBe("1,000");
    expect(r.committedValue).toBe(1000);
  });

  // ── mid-string digit insert that crosses a grouping threshold ────────────
  it("regroups live and lands the caret when a mid-string insert crosses a threshold ($12.50 + 99 at 1 -> $9,912.50)", async () => {
    const props = {
      formatOptions: { style: "currency", currency: "USD" } as Intl.NumberFormatOptions,
      defaultValue: 12.5,
    };
    const r = await type(props, "99", { from: 1 });
    expect(norm(r.liveDisplay)).toBe("$9,912.50");
    expect(r.liveValue).toBe(9912.5);
    // caret sits right after the inserted "99" — between the two grouped 9s,
    // i.e. after "$9,9" (4 visible chars, NBSP-free positions are stable here).
    expect(r.h.input.selectionStart).toBe(4);
    expect(norm(r.committedDisplay)).toBe("$9,912.50");
    expect(r.committedValue).toBe(9912.5);
  });

  it("regroups a trailing-zero value on mid-insert (12.50 + 99 at start -> 9,912.50)", async () => {
    // Type "12.50" continuously so the trailing zero is preserved in the
    // display, then insert "99" at the very start to cross the thousands line.
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "12.50");
    expect(h.display()).toBe("12.50");
    await h.user.type(h.input, "99", { initialSelectionStart: 0, initialSelectionEnd: 0 });
    expect(h.display()).toBe("9,912.50");
    expect(h.value()).toBe(9912.5);
    await h.user.tab();
    // On commit the un-pinned trailing zero is trimmed, but grouping and the
    // exact numeric value survive.
    expect(h.display()).toBe("9,912.5");
    expect(h.value()).toBe(9912.5);
  });

  it("regroups when inserting a single digit pushes a value across the thousands line (123 -> 1,239 at end)", async () => {
    const props = { defaultValue: 123 };
    const r = await type(props, "9", { from: 3 });
    expect(r.liveDisplay).toBe("1,239");
    expect(r.liveValue).toBe(1239);
    expect(r.committedDisplay).toBe("1,239");
    expect(r.committedValue).toBe(1239);
  });

  // ── paste also groups across thresholds ──────────────────────────────────
  it("groups a pasted threshold-crossing integer (1234567 -> 1,234,567)", async () => {
    const r = await paste({}, "1234567");
    expect(r.liveDisplay).toBe("1,234,567");
    expect(r.liveValue).toBe(1234567);
    expect(r.committedDisplay).toBe("1,234,567");
    expect(r.committedValue).toBe(1234567);
  });

  // ── grouping coexists with a fractional part ─────────────────────────────
  it("groups the integer part only, leaving the fraction ungrouped (1234567.89)", async () => {
    const r = await type({}, "1234567.89");
    expect(r.liveDisplay).toBe("1,234,567.89");
    expect(r.liveValue).toBe(1234567.89);
    expect(r.committedDisplay).toBe("1,234,567.89");
    expect(r.committedValue).toBeCloseTo(1234567.89, 10);
  });
});
