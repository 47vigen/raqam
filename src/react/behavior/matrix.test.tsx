import { describe, it, expect } from "vitest";
import { type, norm } from "../../test-utils.js";
import type { NumberFieldRootProps } from "../../core/types.js";
import "../../locales/fa.js";
import "../../locales/ar.js";

// A parameterized regression net. The committed numeric value is locale- and
// style-independent, so it is the strongest invariant to pin across the matrix:
// whatever the user types, the field must commit the exact number — and the
// display must be a non-empty, digit-bearing round-trip of it.

interface FieldDef {
  name: string;
  props: Partial<NumberFieldRootProps>;
  /** locale decimal separator the user would press for this field */
  dec: string;
}

const FIELDS: FieldDef[] = [
  { name: "en-US plain", props: {}, dec: "." },
  { name: "en-US USD", props: { formatOptions: { style: "currency", currency: "USD" } }, dec: "." },
  { name: "de-DE plain", props: { locale: "de-DE" }, dec: "," },
  { name: "de-DE EUR", props: { locale: "de-DE", formatOptions: { style: "currency", currency: "EUR" } }, dec: "," },
  { name: "fr-FR plain", props: { locale: "fr-FR" }, dec: "," },
  { name: "fa-IR plain", props: { locale: "fa-IR" }, dec: "." }, // ASCII "." maps to the native separator
  { name: "ar-EG plain", props: { locale: "ar-EG" }, dec: "." },
];

// (input digits without a separator, expected value)
const INTEGERS: Array<[string, number]> = [
  ["0", 0],
  ["7", 7],
  ["42", 42],
  ["999", 999],
  ["1000", 1000],
  ["1234567", 1234567],
];

describe("matrix — integers round-trip to an exact value in every field", () => {
  for (const f of FIELDS) {
    for (const [text, expected] of INTEGERS) {
      it(`${f.name}: "${text}" -> ${expected}`, async () => {
        const r = await type(f.props, text);
        expect(r.committedValue).toBe(expected);
        // display is a non-empty round-trip that contains a digit
        expect(r.committedDisplay).not.toBe("");
        expect(/\p{Nd}/u.test(r.committedDisplay)).toBe(true);
        // grouping appears once we cross the thousands threshold
        if (expected >= 1000) {
          expect(norm(r.committedDisplay).replace(/\p{Nd}/gu, "")).not.toBe("");
        }
      });
    }
  }
});

describe("matrix — decimals round-trip to an exact value (locale separator)", () => {
  for (const f of FIELDS) {
    it(`${f.name}: "1234${f.dec}56" -> 1234.56`, async () => {
      const r = await type(f.props, `1234${f.dec}56`);
      expect(r.committedValue).toBeCloseTo(1234.56, 10);
    });
    it(`${f.name}: "0${f.dec}5" -> 0.5`, async () => {
      const r = await type(f.props, `0${f.dec}5`);
      expect(r.committedValue).toBeCloseTo(0.5, 10);
    });
  }
});

describe("matrix — negatives round-trip to an exact value in every field", () => {
  for (const f of FIELDS) {
    it(`${f.name}: "-1234${f.dec}5" -> -1234.5`, async () => {
      const r = await type(f.props, `-1234${f.dec}5`);
      expect(r.committedValue).toBeCloseTo(-1234.5, 10);
    });
  }
});
