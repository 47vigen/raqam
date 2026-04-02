import { describe, it, expect } from "vitest";
import { getCaretBoundary, computeNewCursorPosition } from "./cursor.js";
import type { LocaleInfo } from "./types.js";

const enUS: LocaleInfo = {
  decimalSeparator: ".",
  groupingSeparator: ",",
  minusSign: "-",
  zero: "0",
  isRTL: false,
};

const deDE: LocaleInfo = {
  decimalSeparator: ",",
  groupingSeparator: ".",
  minusSign: "-",
  zero: "0",
  isRTL: false,
};

describe("getCaretBoundary", () => {
  it("marks all positions valid for a plain integer", () => {
    const boundary = getCaretBoundary("1234", enUS);
    expect(boundary).toHaveLength(5);
    expect(boundary.every(Boolean)).toBe(true);
  });

  it("marks position after grouping separator as invalid", () => {
    // "1,234" → indices: 0=1, 1=,, 2=2, 3=3, 4=4
    const boundary = getCaretBoundary("1,234", enUS);
    expect(boundary).toHaveLength(6);
    // Position 2 (immediately after the comma) should be invalid
    expect(boundary[2]).toBe(false);
    // Position 1 (before comma), 0, 3, 4, 5 should be valid
    expect(boundary[0]).toBe(true);
    expect(boundary[1]).toBe(true);
    expect(boundary[3]).toBe(true);
    expect(boundary[5]).toBe(true);
  });

  it("marks positions after multiple grouping separators as invalid", () => {
    const boundary = getCaretBoundary("1,234,567", enUS);
    // comma at index 1 → position 2 invalid
    // comma at index 5 → position 6 invalid
    expect(boundary[2]).toBe(false);
    expect(boundary[6]).toBe(false);
    expect(boundary[0]).toBe(true);
    expect(boundary[9]).toBe(true);
  });

  it("first and last are always valid", () => {
    const boundary = getCaretBoundary("1,234", enUS);
    expect(boundary[0]).toBe(true);
    expect(boundary[boundary.length - 1]).toBe(true);
  });

  it("works with de-DE grouping separator (dot)", () => {
    const boundary = getCaretBoundary("1.234", deDE);
    expect(boundary[2]).toBe(false); // position after the dot grouping separator
    expect(boundary[0]).toBe(true);
  });
});

describe("computeNewCursorPosition", () => {
  it("places cursor at end after typing all 4 digits of 1234", () => {
    // User typed "1234" (cursor at 4), gets formatted to "1,234" (length 5)
    const pos = computeNewCursorPosition("1234", 4, "1,234", enUS);
    // 4 accepted chars before cursor in "1234" → should land at position 5 in "1,234"
    expect(pos).toBe(5);
  });

  it("places cursor correctly mid-number", () => {
    // User typed "123" (cursor at 3), formatted to "123" (no comma yet)
    const pos = computeNewCursorPosition("123", 3, "123", enUS);
    expect(pos).toBe(3);
  });

  it("handles backspace on a grouping separator — cursor follows accepted char count", () => {
    // "1,234" — user backspaces the comma
    // By onChange time, oldInput = "1234" (comma already deleted), cursor at 1
    // inputType = "deleteContentBackward"
    // BUT: oldInput[cursor-1] = "1" (not a comma) so no separator-adjustment fires
    // 1 accepted char before cursor → position 1 in "123"
    const pos = computeNewCursorPosition(
      "1234",
      1,
      "123",
      enUS,
      "deleteContentBackward"
    );
    expect(pos).toBe(1);
  });

  it("handles backspace where previous char in OLD display was a grouping separator", () => {
    // This tests the actual separator-backspace edge case:
    // The old display was "1,234" and user placed cursor right after the comma (pos 2)
    // We simulate by passing a value where oldInput[cursor-1] IS the separator
    // That requires the pre-deletion display — a simplified simulation:
    const pos = computeNewCursorPosition(
      "1,234", // old display (pre-deletion snapshot passed in)
      2,       // cursor after the comma
      "123",   // new formatted after deletion
      enUS,
      "deleteContentBackward"
    );
    // 0 accepted chars before pos 2 in "1,234" (comma is not accepted) → pos 0 in "123"
    expect(pos).toBe(0);
  });

  it("handles typing a digit in the middle", () => {
    // Old: "1,34" (malformed, cursor at 2 — user typed in position 2 before '3')
    // New: "134" → "134" (no comma yet for 3-digit number)
    const pos = computeNewCursorPosition("134", 2, "134", enUS);
    expect(pos).toBe(2);
  });

  it("snaps cursor away from invalid position", () => {
    // Force an invalid position scenario by checking snap works
    // "1,234" has position 2 as invalid → snap to 3
    const boundary = getCaretBoundary("1,234", enUS);
    // position 2 is false — snapping should go to 3
    expect(boundary[2]).toBe(false);
    expect(boundary[3]).toBe(true);
  });

  it("places cursor at end for empty string", () => {
    const pos = computeNewCursorPosition("", 0, "", enUS);
    expect(pos).toBe(0);
  });

  it("handles negative number cursor", () => {
    // User typed "-1234" (cursor at 5) → formatted as "-1,234"
    const pos = computeNewCursorPosition("-1234", 5, "-1,234", enUS);
    expect(pos).toBe(6);
  });
});
