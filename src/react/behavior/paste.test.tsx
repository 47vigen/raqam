import { describe, it, expect } from "vitest";
import { paste, norm } from "../../test-utils.js";
// Persian native-digit normalization needs the fa block registered before use.
import "../../locales/fa.js";

// Paste behavior: a clipboard string flows through the real onPaste pipeline
// (currency-strip → digit-normalize → constraint flags → special-notation →
// locale parser → digit-only fallback). We assert BOTH the committed display
// AND the numeric value so a wrong magnitude or a corrupted display both fail.

const USD_ACCT = {
  formatOptions: { style: "currency", currency: "USD", currencySign: "accounting" },
} as const;

describe("plain decimal / grouped paste", () => {
  it("pastes a grouped decimal 1,234.56 as value 1234.56", async () => {
    const r = await paste({}, "1,234.56");
    expect(r.committedValue).toBe(1234.56);
    expect(norm(r.committedDisplay)).toBe("1,234.56");
  });

  it("strips the currency symbol from $1,234.56 yielding 1234.56", async () => {
    const r = await paste({}, "$1,234.56");
    expect(r.committedValue).toBe(1234.56);
    expect(norm(r.committedDisplay)).toBe("1,234.56");
  });

  it("trims surrounding whitespace from '  42  ' to value 42", async () => {
    const r = await paste({}, "  42  ");
    expect(r.committedValue).toBe(42);
    expect(norm(r.committedDisplay)).toBe("42");
  });

  it("keeps three-place precision from 1234.567", async () => {
    const r = await paste({}, "1234.567");
    expect(r.committedValue).toBe(1234.567);
    expect(norm(r.committedDisplay)).toBe("1,234.567");
  });

  it("pastes a negative grouped integer -1,234 as value -1234", async () => {
    const r = await paste({}, "-1,234");
    expect(r.committedValue).toBe(-1234);
    expect(norm(r.committedDisplay)).toBe("-1,234");
  });
});

describe("scientific notation paste", () => {
  it("expands 1e3 to value 1000", async () => {
    const r = await paste({}, "1e3");
    expect(r.committedValue).toBe(1000);
    expect(norm(r.committedDisplay)).toBe("1,000");
  });

  it("expands 1.23E4 to value 12300", async () => {
    const r = await paste({}, "1.23E4");
    expect(r.committedValue).toBe(12300);
    expect(norm(r.committedDisplay)).toBe("12,300");
  });
});

describe("compact-suffix notation paste", () => {
  it("expands 2.5K to value 2500", async () => {
    const r = await paste({}, "2.5K");
    expect(r.committedValue).toBe(2500);
    expect(norm(r.committedDisplay)).toBe("2,500");
  });

  it("expands 3.4M to value 3400000", async () => {
    const r = await paste({}, "3.4M");
    expect(r.committedValue).toBe(3400000);
    expect(norm(r.committedDisplay)).toBe("3,400,000");
  });
});

describe("accounting parentheses paste", () => {
  it("reads ($1,234.56) into an accounting USD field as -1234.56", async () => {
    const r = await paste(USD_ACCT, "(1,234.56)");
    expect(r.committedValue).toBe(-1234.56);
    expect(norm(r.committedDisplay)).toBe("($1,234.56)");
  });
});

describe("native-digit paste", () => {
  it("normalizes Persian ۱۲۳۴ to value 1234", async () => {
    const r = await paste({}, "۱۲۳۴");
    expect(r.committedValue).toBe(1234);
    expect(norm(r.committedDisplay)).toBe("1,234");
  });
});

describe("garbage and mixed input", () => {
  it("leaves the field empty when pasting non-numeric 'abc'", async () => {
    const r = await paste({}, "abc");
    expect(r.committedValue).toBe(null);
    expect(r.committedDisplay).toBe("");
  });

  it("extracts the digits from '12abc34' as value 1234", async () => {
    const r = await paste({}, "12abc34");
    expect(r.committedValue).toBe(1234);
    expect(norm(r.committedDisplay)).toBe("1,234");
  });
});

describe("constraint flags on paste", () => {
  it("never goes negative when allowNegative is false (paste -5 → 5)", async () => {
    const r = await paste({ allowNegative: false }, "-5");
    expect(r.committedValue).toBe(5);
    expect(norm(r.committedDisplay)).toBe("5");
  });

  it("drops the decimal point when allowDecimal is false (paste 1.5 → 15)", async () => {
    const r = await paste({ allowDecimal: false }, "1.5");
    expect(r.committedValue).toBe(15);
    expect(norm(r.committedDisplay)).toBe("15");
  });
});

// A custom parseValue paired with a NON-invertible custom formatValue is the
// canonical magnitude-loss trap: the display ("1.2K") can never be re-parsed
// back to 1234. The paste path threads the parser's known value into state so
// the committed numeric value stays exact instead of being re-derived from the
// lossy display.
describe("custom parseValue / formatValue on paste", () => {
  it("preserves the parsed magnitude through a non-invertible formatValue", async () => {
    const r = await paste(
      {
        parseValue: (s: string) => {
          const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
          return { value: Number.isNaN(n) ? null : n, isIntermediate: false };
        },
        formatValue: (v: number) => `${(v / 1000).toFixed(1)}K`,
      },
      "1234"
    );
    // Magnitude is the exact parsed value, NOT re-derived from the "1.2K" display.
    expect(r.committedValue).toBe(1234);
    expect(norm(r.committedDisplay)).toBe("1.2K");
  });
});

// Step 4 of the paste pipeline: when the primary locale parse fails, the
// digit-only fallback strips everything but digits / locale decimal / sign and
// re-parses. In fa-IR the decimal separator is U+066B, so ASCII dots are NOT
// the decimal — "1.2.3" has two stray ASCII dots the primary parse rejects, and
// the fallback recovers the integer 123.
describe("locale digit-only fallback on paste", () => {
  it("fa: strips ASCII dots that are not the locale decimal, recovering 123", async () => {
    const r = await paste({ locale: "fa" }, "1.2.3");
    expect(r.committedValue).toBe(123);
  });
});

describe("ReDoS guard on paste", () => {
  it("discards an absurdly long paste without catastrophic backtracking", async () => {
    // The old ambiguous regexes in parseSpecialNotation backtracked ~O(n^2):
    // 100k chars took ~10s, which would exceed the test timeout. The length
    // guard + de-ambiguated patterns keep this instant; the field stays empty.
    const huge = `${"9".repeat(100000)}k9`;
    const start = performance.now();
    const r = await paste({ locale: "en-US" }, huge);
    const elapsed = performance.now() - start;
    expect(r.committedValue).toBeNull();
    expect(r.committedDisplay).toBe("");
    expect(elapsed).toBeLessThan(2000);
  });
});
