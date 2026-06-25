import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type, renderField, norm } from "../../test-utils.js";
// Native-digit locales must register their digit blocks before use.
import "../../locales/fa.js";
import "../../locales/ar.js";
import "../../locales/hi.js";
import "../../locales/bn.js";
import "../../locales/th.js";
import { NumberField } from "../NumberField.js";

// ── Native digit entry (fa-IR) ────────────────────────────────────────────────

describe("i18n: Persian (fa-IR) native digit entry", () => {
  it("typing native Persian digits ۱۲۳۴ yields value 1234 and native display ۱٬۲۳۴", async () => {
    const r = await type({ locale: "fa-IR" }, "۱۲۳۴");
    expect(r.committedValue).toBe(1234);
    // Display is fully native — must contain no ASCII digit at all.
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("۱٬۲۳۴");
  });

  it("typing a native decimal separator ۱۲٫۵ yields value 12.5", async () => {
    const r = await type(
      { locale: "fa-IR", allowDecimal: true },
      "۱۲٫۵"
    );
    expect(r.committedValue).toBe(12.5);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("۱۲٫۵");
  });
});

// ── ASCII "." as decimal in native-digit locales ──────────────────────────────

describe("i18n: ASCII period typed as decimal in native-digit locales", () => {
  it("fa-IR: typing ASCII 12.5 yields value 12.5", async () => {
    const r = await type({ locale: "fa-IR", allowDecimal: true }, "12.5");
    expect(r.committedValue).toBe(12.5);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("۱۲٫۵");
  });

  it("fa-IR: typing ASCII 250.75 yields value 250.75", async () => {
    const r = await type({ locale: "fa-IR", allowDecimal: true }, "250.75");
    expect(r.committedValue).toBe(250.75);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("۲۵۰٫۷۵");
  });

  it("ar-EG: typing ASCII 12.5 yields value 12.5", async () => {
    const r = await type({ locale: "ar-EG", allowDecimal: true }, "12.5");
    expect(r.committedValue).toBe(12.5);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("١٢٫٥");
  });

  it("fa-IR: an ASCII '.' is shown as the native separator while typing (no mixed script)", async () => {
    // While typing "12." the live display must already be fully native — the
    // ASCII "." is mapped onto ٫ live, not stranded as a Latin dot.
    const r = await type({ locale: "fa-IR", allowDecimal: true }, "12.");
    expect(r.liveValue).toBe(12);
    expect(norm(r.liveDisplay)).toBe("۱۲٫"); // ۱۲ + ٫ (U+066B), no ASCII "."
    expect(/[0-9.]/.test(r.liveDisplay)).toBe(false);
  });

  it("ar-EG: ASCII period in a currency symbol is left untouched", async () => {
    // EGP currency symbol may carry punctuation; the literal "." in the
    // symbol must never be treated as the decimal — value stays integral.
    const r = await type(
      { locale: "ar-EG", formatOptions: { style: "currency", currency: "USD" } },
      "1234"
    );
    expect(r.committedValue).toBe(1234);
  });
});

// ── Mixed ASCII + native digits ───────────────────────────────────────────────

describe("i18n: mixed ASCII and native digit entry", () => {
  it("fa-IR: typing 12۳۴ (ASCII + Persian) yields value 1234", async () => {
    const r = await type({ locale: "fa-IR" }, "12۳۴");
    expect(r.committedValue).toBe(1234);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("۱٬۲۳۴");
  });
});

// ── Native digits round-trip across scripts ───────────────────────────────────

describe("i18n: native digit round-trip across scripts", () => {
  it("ar-EG: typing Arabic-Indic ١٢٣٤ yields value 1234 with native display", async () => {
    const r = await type({ locale: "ar-EG" }, "١٢٣٤");
    expect(r.committedValue).toBe(1234);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("١٬٢٣٤");
  });

  it("hi-IN: typing Devanagari १२३४ yields value 1234", async () => {
    const r = await type({ locale: "hi-IN" }, "१२३४");
    expect(r.committedValue).toBe(1234);
    // hi-IN formats with ASCII digits by default; assert exact ICU display.
    expect(norm(r.committedDisplay)).toBe("1,234");
  });

  it("bn-BD: typing Bengali ১২৩৪ yields value 1234 with native display", async () => {
    const r = await type({ locale: "bn-BD" }, "১২৩৪");
    expect(r.committedValue).toBe(1234);
    expect(/[0-9]/.test(r.committedDisplay)).toBe(false);
    expect(norm(r.committedDisplay)).toBe("১,২৩৪");
  });

  it("th-TH: typing Thai ๑๒๓๔ yields value 1234", async () => {
    const r = await type({ locale: "th-TH" }, "๑๒๓๔");
    expect(r.committedValue).toBe(1234);
    // th-TH formats with ASCII digits by default; assert exact ICU display.
    expect(norm(r.committedDisplay)).toBe("1,234");
  });
});

// ── de-DE comma decimal ───────────────────────────────────────────────────────

describe("i18n: German (de-DE) comma decimal", () => {
  it("typing 1234,56 yields value 1234.56 with display 1.234,56", async () => {
    const r = await type({ locale: "de-DE", allowDecimal: true }, "1234,56");
    expect(r.committedValue).toBeCloseTo(1234.56, 10);
    expect(norm(r.committedDisplay)).toBe("1.234,56");
  });
});

// ── RTL rendering attributes ──────────────────────────────────────────────────

describe("i18n: RTL rendering for fa-IR", () => {
  it("renders fa-IR input with ltr direction, right text-align and data-rtl marker", () => {
    const h = renderField({ locale: "fa-IR" });
    expect(h.input.style.direction).toBe("ltr");
    expect(h.input.style.textAlign).toBe("right");
    expect(h.input).toHaveAttribute("data-rtl");
  });

  it("renders an LTR locale (en-US) without the data-rtl marker", () => {
    const h = renderField({ locale: "en-US" });
    expect(h.input.style.direction).toBeFalsy();
    expect(h.input).not.toHaveAttribute("data-rtl");
  });
});

// ── Runtime locale switch reformats an idle value ─────────────────────────────

describe("i18n: switching locale reformats an idle value", () => {
  it("changing locale prop from en-US to fa-IR reformats the same value", () => {
    function Harness({ locale }: { locale: string }) {
      return (
        <NumberField.Root locale={locale} defaultValue={1234}>
          <NumberField.Input data-testid="switch-input" />
        </NumberField.Root>
      );
    }
    const { rerender } = render(<Harness locale="en-US" />);
    const input = screen.getByTestId("switch-input") as HTMLInputElement;
    // en-US: ASCII grouping.
    expect(norm(input.value)).toBe("1,234");

    rerender(<Harness locale="fa-IR" />);
    // fa-IR: fully native digits, no ASCII remaining.
    expect(/[0-9]/.test(input.value)).toBe(false);
    expect(norm(input.value)).toBe("۱٬۲۳۴");
  });

  it("mounting 1234 in en-US formats with comma grouping", () => {
    const en = renderField({ locale: "en-US", defaultValue: 1234 });
    expect(norm(en.display())).toBe("1,234");
  });

  it("mounting 1234 in de-DE formats with period grouping", () => {
    const de = renderField({ locale: "de-DE", defaultValue: 1234 });
    expect(norm(de.display())).toBe("1.234");
  });
});

// ── Runtime locale switch on a CONTROLLED value, focus-aware ──────────────────

describe("i18n: controlled value + runtime locale change", () => {
  function Controlled({ locale, value }: { locale: string; value: number }) {
    return (
      <NumberField.Root locale={locale} value={value}>
        <NumberField.Input data-testid="ctrl-input" />
      </NumberField.Root>
    );
  }

  it("does NOT reformat the in-progress display when the locale changes while FOCUSED", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Controlled locale="en-US" value={1234} />);
    const input = screen.getByTestId("ctrl-input") as HTMLInputElement;
    // Idle en-US display.
    expect(norm(input.value)).toBe("1,234");

    // Focus and make a partial, in-progress edit so the display is mid-edit.
    await user.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    await user.type(input, "5", {
      initialSelectionStart: input.value.length,
      initialSelectionEnd: input.value.length,
    });
    const midEdit = input.value;
    // The in-progress edit must carry the new digit (en-US grouping).
    expect(norm(midEdit)).toBe("12,345");

    // Switch locale WHILE STILL FOCUSED — the `!isFocused` guard must hold, so
    // the in-progress display is preserved verbatim (no de-DE re-grouping).
    rerender(<Controlled locale="de-DE" value={1234} />);
    expect(input.value).toBe(midEdit);
    expect(document.activeElement).toBe(input);
  });

  it("reformats a controlled value to the new locale grouping when IDLE", () => {
    const { rerender } = render(<Controlled locale="en-US" value={1234} />);
    const input = screen.getByTestId("ctrl-input") as HTMLInputElement;
    // en-US comma grouping.
    expect(norm(input.value)).toBe("1,234");

    // Not focused: a locale change reformats the same controlled value.
    rerender(<Controlled locale="de-DE" value={1234} />);
    expect(norm(input.value)).toBe("1.234");
  });
});
