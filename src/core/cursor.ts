import type { CaretBoundary, LocaleInfo } from "./types.js";
import { normalizeDigits } from "./normalizer.js";

// ── Accepted-character helpers ────────────────────────────────────────────────

/**
 * Returns true if `ch` is an "accepted" character — one that the user typed
 * intentionally and that contributes to the numeric value:
 *   - ASCII digit 0-9
 *   - The locale decimal separator
 *   - The locale minus sign
 */
function isAccepted(ch: string, info: LocaleInfo): boolean {
  if (ch >= "0" && ch <= "9") return true;
  if (ch === info.decimalSeparator) return true;
  if (ch === info.minusSign || ch === "-") return true;
  return false;
}

/**
 * Count how many "accepted" characters appear before position `cursor`
 * in `str` (after normalising non-Latin digits to ASCII).
 */
function countAcceptedBefore(
  str: string,
  cursor: number,
  info: LocaleInfo
): number {
  const normalised = normalizeDigits(str);
  let count = 0;
  for (let i = 0; i < cursor && i < normalised.length; i++) {
    if (isAccepted(normalised[i]!, info)) count++;
  }
  return count;
}

// ── Caret boundary ────────────────────────────────────────────────────────────

/**
 * Build a boolean array of length `formattedValue.length + 1`.
 * `true`  → cursor may rest at this position.
 * `false` → cursor must snap away (sits inside a formatting-only character
 *            such as a grouping separator or a currency prefix).
 *
 * Rules:
 *  - Start and end positions are always valid.
 *  - A position immediately AFTER a grouping separator is invalid (the
 *    cursor would look like it's between two digits but moving left would
 *    skip the comma).
 *  - A position immediately BEFORE a grouping separator is valid.
 */
export function getCaretBoundary(
  formattedValue: string,
  info: LocaleInfo
): CaretBoundary {
  const len = formattedValue.length;
  const boundary: CaretBoundary = new Array(len + 1).fill(true) as boolean[];

  for (let i = 0; i < len; i++) {
    const ch = formattedValue[i]!;
    if (ch === info.groupingSeparator) {
      // Position immediately after the grouping separator is invalid
      boundary[i + 1] = false;
    }
  }

  // First and last are always valid
  boundary[0] = true;
  boundary[len] = true;

  return boundary;
}

// ── Cursor computation ────────────────────────────────────────────────────────

/**
 * Compute the new cursor position in `newFormatted` that corresponds
 * semantically to `oldCursor` in `oldInput`.
 *
 * Algorithm (3 stages from the spec):
 *
 * 1. Count accepted characters before `oldCursor` in `oldInput`.
 * 2. Adjust for backspace-over-separator edge case.
 * 3. Walk `newFormatted` to find the position where the same count of
 *    accepted chars precede it; snap to the nearest valid boundary.
 *
 * @param oldInput     The raw string the user just typed into (pre-format)
 * @param oldCursor    selectionStart captured from the native event
 * @param newFormatted The formatted string we're about to display
 * @param info         Locale separators
 * @param inputType    e.nativeEvent.inputType (optional — for backspace detection)
 */
export function computeNewCursorPosition(
  oldInput: string,
  oldCursor: number,
  newFormatted: string,
  info: LocaleInfo,
  inputType?: string
): number {
  const normalised = normalizeDigits(oldInput);

  // Stage 1: count accepted chars before cursor in old input
  let acceptedCount = countAcceptedBefore(normalised, oldCursor, info);

  // Stage 2: backspace on grouping separator — also delete the preceding digit
  if (
    inputType === "deleteContentBackward" &&
    oldCursor > 0 &&
    oldInput[oldCursor - 1] === info.groupingSeparator
  ) {
    // The separator was deleted but we want to remove the preceding digit too
    acceptedCount = Math.max(0, acceptedCount - 1);
  }

  // Stage 3: build boundary and walk new formatted string
  const boundary = getCaretBoundary(newFormatted, info);
  const normNew = normalizeDigits(newFormatted);
  let count = 0;
  let pos = 0;

  for (let i = 0; i < normNew.length; i++) {
    if (count === acceptedCount) {
      pos = i;
      break;
    }
    if (isAccepted(normNew[i]!, info)) count++;
    pos = i + 1;
  }

  // If we ran through the entire string without reaching the target count,
  // place the cursor at the end. Note: acceptedCount === 0 means we correctly
  // want pos = 0 (set in the loop), so we must NOT override that case.
  if (acceptedCount > 0 && count < acceptedCount) {
    pos = newFormatted.length;
  }

  // Snap to nearest valid boundary
  pos = snapToBoundary(pos, boundary);

  return pos;
}

/**
 * If `pos` is at a false (invalid) boundary position, find the nearest
 * true position. Prefers moving forward; falls back to backward.
 */
function snapToBoundary(pos: number, boundary: CaretBoundary): number {
  if (boundary[pos]) return pos;

  // Try forward first
  for (let i = pos + 1; i < boundary.length; i++) {
    if (boundary[i]) return i;
  }
  // Fall back to backward
  for (let i = pos - 1; i >= 0; i--) {
    if (boundary[i]) return i;
  }
  return 0;
}
