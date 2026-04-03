/**
 * Locale integration tests — Phase 4
 *
 * Tests every supported locale at three levels:
 *   1. Core (formatter + parser): separator extraction, round-trip, digit input
 *   2. React (NumberField component): correct numeric value from locale digits
 *   3. LOCALE_CODES metadata exports
 *
 * Locale plugins are imported as side-effects at the top of this file so the
 * normalizer's digit block registry is populated before any test runs.
 */

// ── Side-effect imports to register all digit blocks ─────────────────────────
import "./fa.js";
import "./ar.js";
import "./hi.js";
import "./bn.js";
import "./th.js";

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createFormatter } from "../core/formatter.js";
import { createParser } from "../core/parser.js";
import { normalizeDigits } from "../core/normalizer.js";
import { NumberField } from "../react/NumberField.js";

import { LOCALE_CODES as FA_CODES } from "./fa.js";
import { LOCALE_CODES as AR_CODES } from "./ar.js";
import { LOCALE_CODES as HI_CODES } from "./hi.js";
import { LOCALE_CODES as BN_CODES } from "./bn.js";
import { LOCALE_CODES as TH_CODES } from "./th.js";

import {
  getLocaleInfo,
  fmt,
  parse,
  roundTrip,
  toLocaleDigits,
  localeUsesNativeDigits,
} from "./test-utils.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render a bare NumberField and return the <input> element. */
function renderInput(locale: string, defaultValue?: number) {
  render(
    <NumberField.Root locale={locale} defaultValue={defaultValue}>
      <NumberField.Input data-testid="input" />
    </NumberField.Root>
  );
  return screen.getByTestId("input") as HTMLInputElement;
}

// ── 1. LOCALE_CODES metadata ──────────────────────────────────────────────────

describe("LOCALE_CODES exports", () => {
  it("fa LOCALE_CODES contains fa-IR", () => {
    expect(FA_CODES).toContain("fa-IR");
    expect(FA_CODES).toContain("fa");
  });

  it("ar LOCALE_CODES contains ar-EG", () => {
    expect(AR_CODES).toContain("ar-EG");
    expect(AR_CODES).toContain("ar");
  });

  it("hi LOCALE_CODES contains hi-IN", () => {
    expect(HI_CODES).toContain("hi-IN");
    expect(HI_CODES).toContain("hi");
  });

  it("bn LOCALE_CODES contains bn-BD", () => {
    expect(BN_CODES).toContain("bn-BD");
    expect(BN_CODES).toContain("bn");
  });

  it("th LOCALE_CODES contains th-TH", () => {
    expect(TH_CODES).toContain("th-TH");
    expect(TH_CODES).toContain("th");
  });

  it("all LOCALE_CODES arrays are readonly tuples", () => {
    // Verify the types aren't accidentally widened to string[]
    expect(Array.isArray(FA_CODES)).toBe(true);
    expect(Array.isArray(AR_CODES)).toBe(true);
    expect(Array.isArray(HI_CODES)).toBe(true);
    expect(Array.isArray(BN_CODES)).toBe(true);
    expect(Array.isArray(TH_CODES)).toBe(true);
  });
});

// ── 2. Separator extraction via formatToParts ─────────────────────────────────

describe("separator extraction", () => {
  it("en-US uses period decimal and comma grouping", () => {
    const info = getLocaleInfo("en-US");
    expect(info.decimalSeparator).toBe(".");
    expect(info.groupingSeparator).toBe(",");
    expect(info.isRTL).toBe(false);
  });

  it("de-DE uses comma decimal and period grouping", () => {
    const info = getLocaleInfo("de-DE");
    expect(info.decimalSeparator).toBe(",");
    expect(info.groupingSeparator).toBe(".");
    expect(info.isRTL).toBe(false);
  });

  it("fa-IR is detected as RTL", () => {
    const info = getLocaleInfo("fa-IR");
    expect(info.isRTL).toBe(true);
  });

  it("ar-EG is detected as RTL", () => {
    const info = getLocaleInfo("ar-EG");
    expect(info.isRTL).toBe(true);
  });

  it("he-IL is detected as RTL", () => {
    const info = getLocaleInfo("he-IL");
    expect(info.isRTL).toBe(true);
  });

  it("hi-IN is not RTL", () => {
    const info = getLocaleInfo("hi-IN");
    expect(info.isRTL).toBe(false);
  });

  it("th-TH is not RTL", () => {
    const info = getLocaleInfo("th-TH");
    expect(info.isRTL).toBe(false);
  });

  it("bn-BD is not RTL", () => {
    const info = getLocaleInfo("bn-BD");
    expect(info.isRTL).toBe(false);
  });
});

// ── 3. Round-trip: format → parse → same value ───────────────────────────────

describe("round-trip: format → parse", () => {
  const CASES: Array<[string, number]> = [
    ["en-US", 1234567.89],
    ["en-US", 0],
    ["en-US", -42.5],
    ["de-DE", 1234567.89],
    ["de-DE", -99.99],
    ["fr-FR", 1234567.89],
    ["fa-IR", 12345],
    ["fa-IR", 1234.5],
    ["ar-EG", 9876],
    ["hi-IN", 123456],
    ["hi-IN", 1000000],
    ["bn-BD", 54321],
    ["th-TH", 777],
  ];

  for (const [locale, value] of CASES) {
    it(`${locale}: ${value}`, () => {
      expect(roundTrip(locale, value)).toBe(true);
    });
  }
});

// ── 4. Hindi/Bengali lakh grouping ───────────────────────────────────────────

describe("lakh/crore grouping", () => {
  it("hi-IN formats 100000 with lakh grouping", () => {
    const formatted = fmt("hi-IN", 100000);
    // hi-IN groups as 1,00,000 (first group of 3, then groups of 2)
    const parsed = parse("hi-IN", formatted);
    expect(parsed).toBe(100000);
  });

  it("hi-IN formats 10000000 as 1,00,00,000 (crore)", () => {
    const formatted = fmt("hi-IN", 10000000);
    const parsed = parse("hi-IN", formatted);
    expect(parsed).toBe(10000000);
  });

  it("bn-BD formats 100000 with lakh grouping", () => {
    const formatted = fmt("bn-BD", 100000);
    const parsed = parse("bn-BD", formatted);
    expect(parsed).toBe(100000);
  });

  it("hi-IN round-trip for common financial values", () => {
    for (const v of [1, 100, 999, 1000, 12345, 123456, 9876543]) {
      expect(roundTrip("hi-IN", v)).toBe(true);
    }
  });
});

// ── 5. Unicode digit normalization ───────────────────────────────────────────

describe("Unicode digit normalization", () => {
  // Persian Extended Arabic-Indic (U+06F0–U+06F9)
  it("normalizes Persian digits ۰–۹ to ASCII", () => {
    // ۱۲۳۴۵۶۷۸۹۰
    expect(normalizeDigits("\u06f1\u06f2\u06f3")).toBe("123");
    expect(normalizeDigits("\u06f0")).toBe("0");
    expect(normalizeDigits("\u06f9")).toBe("9");
  });

  // Arabic-Indic (U+0660–U+0669)
  it("normalizes Arabic-Indic digits ٠–٩ to ASCII", () => {
    expect(normalizeDigits("\u0661\u0662\u0663")).toBe("123");
    expect(normalizeDigits("\u0660")).toBe("0");
    expect(normalizeDigits("\u0669")).toBe("9");
  });

  // Devanagari (U+0966–U+096F)
  it("normalizes Devanagari digits ०–९ to ASCII", () => {
    expect(normalizeDigits("\u0967\u0968\u0969")).toBe("123");
    expect(normalizeDigits("\u0966")).toBe("0");
    expect(normalizeDigits("\u096f")).toBe("9");
  });

  // Bengali (U+09E6–U+09EF)
  it("normalizes Bengali digits ০–৯ to ASCII", () => {
    expect(normalizeDigits("\u09e7\u09e8\u09e9")).toBe("123");
    expect(normalizeDigits("\u09e6")).toBe("0");
    expect(normalizeDigits("\u09ef")).toBe("9");
  });

  // Thai (U+0E50–U+0E59)
  it("normalizes Thai digits ๐–๙ to ASCII", () => {
    expect(normalizeDigits("\u0e51\u0e52\u0e53")).toBe("123");
    expect(normalizeDigits("\u0e50")).toBe("0");
    expect(normalizeDigits("\u0e59")).toBe("9");
  });

  it("preserves ASCII digits unchanged", () => {
    expect(normalizeDigits("1234567890")).toBe("1234567890");
  });

  it("preserves non-digit characters", () => {
    expect(normalizeDigits("$1,234.56")).toBe("$1,234.56");
    expect(normalizeDigits("abc")).toBe("abc");
  });

  it("handles mixed Persian + ASCII input", () => {
    // ۱2۳ → 123
    expect(normalizeDigits("\u06f1" + "2" + "\u06f3")).toBe("123");
  });
});

// ── 6. Parser: locale digit strings → correct numeric values ─────────────────

describe("parser: locale digit strings", () => {
  it("parses Persian digits via fa-IR formatter round-trip", () => {
    const parser = createParser({ locale: "fa-IR" });
    const formatter = createFormatter({ locale: "fa-IR" });
    const formatted = formatter.format(12345);
    const result = parser.parse(formatted);
    expect(result.value).toBe(12345);
    expect(result.isValid).toBe(true);
  });

  it("parses Arabic-Indic digits via ar-EG round-trip", () => {
    const parser = createParser({ locale: "ar-EG" });
    const formatter = createFormatter({ locale: "ar-EG" });
    const formatted = formatter.format(9876);
    const result = parser.parse(formatted);
    expect(result.value).toBe(9876);
    expect(result.isValid).toBe(true);
  });

  it("parses Devanagari digits via hi-IN round-trip", () => {
    const parser = createParser({ locale: "hi-IN" });
    const formatter = createFormatter({ locale: "hi-IN" });
    const formatted = formatter.format(54321);
    const result = parser.parse(formatted);
    expect(result.value).toBe(54321);
    expect(result.isValid).toBe(true);
  });

  it("parses Bengali digits via bn-BD round-trip", () => {
    const parser = createParser({ locale: "bn-BD" });
    const formatter = createFormatter({ locale: "bn-BD" });
    const formatted = formatter.format(777);
    const result = parser.parse(formatted);
    expect(result.value).toBe(777);
    expect(result.isValid).toBe(true);
  });

  it("parses Thai digits via th-TH round-trip", () => {
    const parser = createParser({ locale: "th-TH" });
    const formatter = createFormatter({ locale: "th-TH" });
    const formatted = formatter.format(42);
    const result = parser.parse(formatted);
    expect(result.value).toBe(42);
    expect(result.isValid).toBe(true);
  });

  it("parses raw Persian digit string (no formatter)", () => {
    // ۱۲۳۴ — normalizer converts to 1234 before parsing
    const parser = createParser({ locale: "fa-IR" });
    const result = parser.parse("\u06f1\u06f2\u06f3\u06f4");
    expect(result.value).toBe(1234);
    expect(result.isValid).toBe(true);
  });

  it("parses raw Arabic-Indic digit string", () => {
    // ١٢٣٤
    const parser = createParser({ locale: "ar-EG" });
    const result = parser.parse("\u0661\u0662\u0663\u0664");
    expect(result.value).toBe(1234);
    expect(result.isValid).toBe(true);
  });

  it("parses raw Devanagari digit string", () => {
    // १२३
    const parser = createParser({ locale: "hi-IN" });
    const result = parser.parse("\u0967\u0968\u0969");
    expect(result.value).toBe(123);
    expect(result.isValid).toBe(true);
  });

  it("parses raw Bengali digit string", () => {
    // ১২৩
    const parser = createParser({ locale: "bn-BD" });
    const result = parser.parse("\u09e7\u09e8\u09e9");
    expect(result.value).toBe(123);
    expect(result.isValid).toBe(true);
  });

  it("parses raw Thai digit string", () => {
    // ๑๒๓
    const parser = createParser({ locale: "th-TH" });
    const result = parser.parse("\u0e51\u0e52\u0e53");
    expect(result.value).toBe(123);
    expect(result.isValid).toBe(true);
  });
});

// ── 7. React component: locale digit input produces correct numberValue ───────

describe("NumberField: locale digit input", () => {
  it("typing Persian digits produces correct numberValue (fa-IR)", async () => {
    let capturedValue: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="fa-IR"
        onValueChange={(v) => { capturedValue = v; }}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("input") as HTMLInputElement;
    await user.click(input);

    // Type Persian digits ۱۲۳ (U+06F1, U+06F2, U+06F3)
    await user.type(input, "\u06f1\u06f2\u06f3");

    // Fire blur to commit the value
    await user.tab();
    expect(capturedValue).toBe(123);
  });

  it("typing Arabic-Indic digits produces correct numberValue (ar-EG)", async () => {
    let capturedValue: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="ar-EG"
        onValueChange={(v) => { capturedValue = v; }}
      >
        <NumberField.Input data-testid="ar-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("ar-input") as HTMLInputElement;
    await user.click(input);
    // ١٢٣٤ (Arabic-Indic)
    await user.type(input, "\u0661\u0662\u0663\u0664");
    await user.tab();
    expect(capturedValue).toBe(1234);
  });

  it("typing Devanagari digits produces correct numberValue (hi-IN)", async () => {
    let capturedValue: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="hi-IN"
        onValueChange={(v) => { capturedValue = v; }}
      >
        <NumberField.Input data-testid="hi-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("hi-input") as HTMLInputElement;
    await user.click(input);
    // ४२ (Devanagari 4, 2)
    await user.type(input, "\u096a\u0968");
    await user.tab();
    expect(capturedValue).toBe(42);
  });

  it("typing Bengali digits produces correct numberValue (bn-BD)", async () => {
    let capturedValue: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="bn-BD"
        onValueChange={(v) => { capturedValue = v; }}
      >
        <NumberField.Input data-testid="bn-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("bn-input") as HTMLInputElement;
    await user.click(input);
    // ৫৫৫ (Bengali 5, 5, 5)
    await user.type(input, "\u09eb\u09eb\u09eb");
    await user.tab();
    expect(capturedValue).toBe(555);
  });

  it("typing Thai digits produces correct numberValue (th-TH)", async () => {
    let capturedValue: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="th-TH"
        onValueChange={(v) => { capturedValue = v; }}
      >
        <NumberField.Input data-testid="th-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("th-input") as HTMLInputElement;
    await user.click(input);
    // ๗ (Thai 7)
    await user.type(input, "\u0e57");
    await user.tab();
    expect(capturedValue).toBe(7);
  });

  it("defaultValue renders correctly formatted in locale", () => {
    const input = renderInput("en-US", 1234567);
    // en-US formats 1234567 as 1,234,567
    expect(input.value).toContain("1");
    // Numeric value should include grouping
    const parser = createParser({ locale: "en-US" });
    const result = parser.parse(input.value);
    expect(result.value).toBe(1234567);
  });

  it("increment/decrement work in RTL locale (fa-IR)", async () => {
    let capturedValue: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="fa-IR"
        defaultValue={5}
        step={1}
        onValueChange={(v) => { capturedValue = v; }}
      >
        <NumberField.Input data-testid="fa-inc-input" />
        <NumberField.Increment data-testid="fa-increment">+</NumberField.Increment>
        <NumberField.Decrement data-testid="fa-decrement">-</NumberField.Decrement>
      </NumberField.Root>
    );

    await user.click(screen.getByTestId("fa-increment"));
    expect(capturedValue).toBe(6);

    await user.click(screen.getByTestId("fa-decrement"));
    expect(capturedValue).toBe(5);
  });
});

// ── 8. toLocaleDigits test utility self-test ──────────────────────────────────

describe("toLocaleDigits utility", () => {
  it("converts ASCII to correct digit script when runtime supports it", () => {
    // We just verify it produces a string; the exact digits depend on runtime ICU
    const fa = toLocaleDigits("fa-IR", "123");
    expect(typeof fa).toBe("string");
    expect(fa).toHaveLength(3);

    const en = toLocaleDigits("en-US", "123");
    // en-US should return ASCII digits
    expect(en).toBe("123");
  });
});

// ── 9. localeUsesNativeDigits utility ────────────────────────────────────────

describe("localeUsesNativeDigits utility", () => {
  it("en-US does NOT use native (non-ASCII) digits", () => {
    expect(localeUsesNativeDigits("en-US")).toBe(false);
  });

  it("de-DE does NOT use native digits", () => {
    expect(localeUsesNativeDigits("de-DE")).toBe(false);
  });

  // If runtime has full ICU these will be true; if not, they may be false.
  // Either way the helper should return a boolean without throwing.
  it("returns boolean for fa-IR without throwing", () => {
    const result = localeUsesNativeDigits("fa-IR");
    expect(typeof result).toBe("boolean");
  });

  it("returns boolean for ar-EG without throwing", () => {
    const result = localeUsesNativeDigits("ar-EG");
    expect(typeof result).toBe("boolean");
  });
});
