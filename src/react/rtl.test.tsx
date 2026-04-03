/**
 * RTL rendering tests — Phase 4
 *
 * Validates that RTL locales (Arabic, Persian, Hebrew, Urdu) cause the <input>
 * to receive the BiDi-safe CSS styles:
 *   direction: ltr        — digits always flow left-to-right (mathematical convention)
 *   text-align: right     — visual alignment in RTL page context
 *   unicode-bidi: embed   — isolates the LTR number from surrounding RTL text
 *   data-rtl=""           — allows pure-CSS RTL-specific overrides
 *
 * LTR locales must NOT receive any of these overrides.
 *
 * Side-effect locale plugin imports are NOT needed here — RTL detection is
 * driven entirely by the BCP 47 locale tag (via regex on resolved locale),
 * not by digit normalization.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NumberField } from "./NumberField.js";

// ── Helper: render input with a given locale and return the <input> element ───

function renderInput(locale: string, extraProps: Record<string, unknown> = {}) {
  render(
    <NumberField.Root locale={locale} defaultValue={42} {...extraProps}>
      <NumberField.Input data-testid="input" />
    </NumberField.Root>
  );
  return screen.getByTestId("input") as HTMLInputElement;
}

// ── 1. RTL locales receive BiDi-safe styles ───────────────────────────────────

describe("RTL locales: BiDi-safe input styles", () => {
  const RTL_LOCALES = ["fa-IR", "ar-EG", "ar-SA", "ar", "he-IL", "ur-PK"];

  for (const locale of RTL_LOCALES) {
    it(`${locale}: direction is ltr`, () => {
      const input = renderInput(locale);
      expect(input.style.direction).toBe("ltr");
    });

    it(`${locale}: text-align is right`, () => {
      const input = renderInput(locale);
      expect(input.style.textAlign).toBe("right");
    });

    it(`${locale}: unicode-bidi is embed`, () => {
      const input = renderInput(locale);
      expect(input.style.unicodeBidi).toBe("embed");
    });

    it(`${locale}: data-rtl attribute is present`, () => {
      const input = renderInput(locale);
      expect(input).toHaveAttribute("data-rtl");
    });
  }
});

// ── 2. LTR locales do NOT receive RTL styles ──────────────────────────────────

describe("LTR locales: no RTL styles applied", () => {
  const LTR_LOCALES = ["en-US", "de-DE", "fr-FR", "hi-IN", "bn-BD", "th-TH", "zh-CN", "ja-JP", "ko-KR"];

  for (const locale of LTR_LOCALES) {
    it(`${locale}: no direction override`, () => {
      const input = renderInput(locale);
      // style.direction should be falsy or empty (no explicit override)
      expect(input.style.direction).toBeFalsy();
    });

    it(`${locale}: no data-rtl attribute`, () => {
      const input = renderInput(locale);
      expect(input).not.toHaveAttribute("data-rtl");
    });
  }
});

// ── 3. aria-valuetext shows the locale-formatted string ──────────────────────

describe("aria-valuetext in RTL locales", () => {
  it("fa-IR: aria-valuetext is present and non-empty for a non-null value", () => {
    const input = renderInput("fa-IR");
    const valueText = input.getAttribute("aria-valuetext");
    // Should be set to the formatted string (e.g. "۴۲" or "42" depending on ICU)
    expect(valueText).toBeTruthy();
    expect(typeof valueText).toBe("string");
  });

  it("ar-EG: aria-valuetext is present and non-empty", () => {
    const input = renderInput("ar-EG");
    expect(input.getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("en-US: aria-valuetext is present and non-empty", () => {
    const input = renderInput("en-US");
    expect(input.getAttribute("aria-valuetext")).toBeTruthy();
  });
});

// ── 4. role=spinbutton remains correct for RTL locales ───────────────────────

describe("ARIA spinbutton role in RTL locales", () => {
  it("fa-IR input has role=spinbutton", () => {
    const input = renderInput("fa-IR");
    expect(input).toHaveAttribute("role", "spinbutton");
  });

  it("ar-EG input has role=spinbutton", () => {
    const input = renderInput("ar-EG");
    expect(input).toHaveAttribute("role", "spinbutton");
  });
});

// ── 5. Keyboard increment/decrement in RTL locales ───────────────────────────

describe("keyboard increment/decrement in RTL locale", () => {
  it("fa-IR: ArrowUp increments value", async () => {
    let value: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="fa-IR"
        defaultValue={10}
        step={1}
        onValueChange={(v) => { value = v; }}
      >
        <NumberField.Input data-testid="fa-kb-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("fa-kb-input");
    await user.click(input);
    await user.keyboard("{ArrowUp}");
    expect(value).toBe(11);
  });

  it("ar-EG: ArrowDown decrements value", async () => {
    let value: number | null = null;
    const user = userEvent.setup();

    render(
      <NumberField.Root
        locale="ar-EG"
        defaultValue={10}
        step={1}
        onValueChange={(v) => { value = v; }}
      >
        <NumberField.Input data-testid="ar-kb-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("ar-kb-input");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(value).toBe(9);
  });
});

// ── 6. Locale switches update RTL styles dynamically ─────────────────────────

describe("locale switch changes RTL styles", () => {
  it("switching from LTR (en-US) to RTL (fa-IR) applies RTL styles", () => {
    const { rerender } = render(
      <NumberField.Root locale="en-US" defaultValue={1}>
        <NumberField.Input data-testid="switch-input" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("switch-input");
    expect(input.style.direction).toBeFalsy();
    expect(input).not.toHaveAttribute("data-rtl");

    rerender(
      <NumberField.Root locale="fa-IR" defaultValue={1}>
        <NumberField.Input data-testid="switch-input" />
      </NumberField.Root>
    );

    expect(input.style.direction).toBe("ltr");
    expect(input).toHaveAttribute("data-rtl");
  });

  it("switching from RTL (ar-EG) to LTR (en-US) removes RTL styles", () => {
    const { rerender } = render(
      <NumberField.Root locale="ar-EG" defaultValue={1}>
        <NumberField.Input data-testid="switch-input-2" />
      </NumberField.Root>
    );

    const input = screen.getByTestId("switch-input-2");
    expect(input.style.direction).toBe("ltr");
    expect(input).toHaveAttribute("data-rtl");

    rerender(
      <NumberField.Root locale="en-US" defaultValue={1}>
        <NumberField.Input data-testid="switch-input-2" />
      </NumberField.Root>
    );

    expect(input.style.direction).toBeFalsy();
    expect(input).not.toHaveAttribute("data-rtl");
  });
});

// ── 7. inputmode and type attributes are locale-independent ──────────────────

describe("input type/inputmode are locale-independent", () => {
  for (const locale of ["en-US", "fa-IR", "ar-EG", "hi-IN"]) {
    it(`${locale}: type=text and inputmode=decimal`, () => {
      const input = renderInput(locale);
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("inputmode", "decimal");
    });
  }
});
