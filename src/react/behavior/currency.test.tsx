import { describe, it, expect } from "vitest";
import { type, renderField, backspaceFromEnd, norm } from "../../test-utils.js";
// ar-EG uses native Arabic-Indic digits — register the block before use.
import "../../locales/ar.js";

const USD = { formatOptions: { style: "currency", currency: "USD" } } as const;
const EUR_DE = { locale: "de-DE", formatOptions: { style: "currency", currency: "EUR" } } as const;
const EGP_AR = { locale: "ar-EG", formatOptions: { style: "currency", currency: "EGP" } } as const;
const USD_ACCT = {
  formatOptions: { style: "currency", currency: "USD", currencySign: "accounting" },
} as const;

describe("USD prefix currency", () => {
  it("formats 1234.56 as $1,234.56 with value 1234.56", async () => {
    const r = await type(USD, "1234.56");
    expect(norm(r.liveDisplay)).toBe("$1,234.56");
    expect(norm(r.committedDisplay)).toBe("$1,234.56");
    expect(r.committedValue).toBe(1234.56);
  });

  it("pads a bare integer to $25.00 on commit", async () => {
    const r = await type(USD, "25");
    expect(norm(r.committedDisplay)).toBe("$25.00");
    expect(r.committedValue).toBe(25);
  });

  it("groups millions live and pads cents on blur", async () => {
    const r = await type(USD, "1234567");
    expect(norm(r.liveDisplay)).toBe("$1,234,567");
    expect(norm(r.committedDisplay)).toBe("$1,234,567.00");
    expect(r.committedValue).toBe(1234567);
  });

  it("does not prematurely pad .00 while typing an integer", async () => {
    const r = await type(USD, "1234");
    expect(norm(r.liveDisplay)).toBe("$1,234");
    expect(r.liveValue).toBe(1234);
    expect(norm(r.committedDisplay)).toBe("$1,234.00");
    expect(r.committedValue).toBe(1234);
  });

  it("keeps leading-zero cents 0.25 exact", async () => {
    const r = await type(USD, "0.25");
    expect(norm(r.committedDisplay)).toBe("$0.25");
    expect(r.committedValue).toBe(0.25);
  });

  it("keeps cents 1.05 exact (no dropped zero)", async () => {
    const r = await type(USD, "1.05");
    expect(norm(r.committedDisplay)).toBe("$1.05");
    expect(r.committedValue).toBe(1.05);
  });

  it("keeps trailing-zero cents 19.90 exact", async () => {
    const r = await type(USD, "19.90");
    expect(norm(r.committedDisplay)).toBe("$19.90");
    expect(r.committedValue).toBe(19.9);
  });
});

describe("de-DE EUR suffix currency", () => {
  it("round-trips 1234.56 as a suffixed euro amount", async () => {
    const r = await type(EUR_DE, "1234,56");
    expect(norm(r.committedDisplay)).toBe("1.234,56 €");
    expect(r.committedValue).toBe(1234.56);
  });

  it("pads a bare integer to ,00 on commit", async () => {
    const r = await type(EUR_DE, "1234");
    expect(norm(r.liveDisplay)).toBe("1.234 €");
    expect(norm(r.committedDisplay)).toBe("1.234,00 €");
    expect(r.committedValue).toBe(1234);
  });
});

describe("ar-EG EGP currency (native digits, dotted symbol)", () => {
  it("typing 1234 does not clear the field and commits 1234", async () => {
    const r = await type(EGP_AR, "1234");
    expect(r.committedValue).toBe(1234);
    expect(r.committedDisplay).not.toBe("");
  });

  it("typing a decimal commits 12.5", async () => {
    const r = await type(EGP_AR, "12.50");
    expect(r.committedValue).toBe(12.5);
    expect(r.committedDisplay).not.toBe("");
  });
});

describe("accounting USD negatives", () => {
  it("renders -1234.56 with parentheses and value -1234.56", async () => {
    const r = await type(USD_ACCT, "-1234.56");
    expect(norm(r.committedDisplay)).toBe("($1,234.56)");
    expect(r.committedValue).toBe(-1234.56);
  });
});

describe("suffix-currency backspace from end", () => {
  it("deletes the digit without re-padding ,00 then clears", async () => {
    const h = renderField(EUR_DE);
    await h.user.click(h.input);
    await h.user.type(h.input, "1234");
    expect(norm(h.display())).toBe("1.234 €");

    await backspaceFromEnd(h, 1);
    expect(norm(h.display())).toBe("123 €");
    expect(h.value()).toBe(123);

    await backspaceFromEnd(h, 3);
    expect(h.value()).toBe(null);
    expect(h.display()).toBe("");
  });
});
