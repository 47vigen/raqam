import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { NumberField } from "./NumberField.js";
import "../locales/fa.js";
import "../locales/ar.js";

const getInput = () => screen.getByTestId("input") as HTMLInputElement;
function mount(props: Record<string, unknown> = {}) {
  render(
    <NumberField.Root locale="en-US" {...props}>
      <NumberField.Input data-testid="input" />
    </NumberField.Root>
  );
  return getInput();
}
// continuous typing (single type() call => caret advances like a real keyboard)
async function type(props: Record<string, unknown>, text: string) {
  const u = userEvent.setup();
  const input = mount(props);
  await u.click(input);
  await u.type(input, text);
  return { u, input, typed: input.value };
}
async function typeBlur(props: Record<string, unknown>, text: string) {
  const { u, input, typed } = await type(props, text);
  await u.tab();
  return { typed, blurred: input.value };
}

// ── C1: decimal swallowed once grouping appears (>=1000) ──────────────────────
describe("C1 decimal + grouping", () => {
  it("type 1234.56 keeps the decimal", async () => {
    expect((await typeBlur({}, "1234.56")).blurred).toBe("1,234.56");
  });
  it("type 1000.25", async () => {
    expect((await typeBlur({}, "1000.25")).blurred).toBe("1,000.25");
  });
  it("type large 1234567.89", async () => {
    expect((await typeBlur({}, "1234567.89")).blurred).toBe("1,234,567.89");
  });
  it("negative + grouping + decimal -1234.5", async () => {
    expect((await typeBlur({}, "-1234.5")).blurred).toBe("-1,234.5");
  });
  it("de-DE 1234,56", async () => {
    expect((await typeBlur({ locale: "de-DE" }, "1234,56")).blurred).toBe("1.234,56");
  });
  it("fa-IR native ۱۲۳۴٫۵۶", async () => {
    expect((await typeBlur({ locale: "fa-IR" }, "۱۲۳۴٫۵۶")).blurred).toBe("۱٬۲۳۴٫۵۶");
  });
});

// ── C2: trailing-zero / trailing-dot must NOT wipe on blur ───────────────────
describe("C2 trailing zero blur preserves value", () => {
  for (const [text, blur] of [["1.50", "1.5"], ["19.90", "19.9"], ["1.00", "1"], ["1.", "1"], ["100.10", "100.1"]] as const) {
    it(`type ${text} -> blur ${blur} (not wiped)`, async () => {
      expect((await typeBlur({}, text)).blurred).toBe(blur);
    });
  }
  it("does not wipe and keeps numberValue (onChange fired)", async () => {
    let last: number | null = -999;
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" onChange={(v) => { last = v; }}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, "1.50");
    expect(last).toBe(1.5);
  });
});

// ── H1: leading-dot .5 ───────────────────────────────────────────────────────
describe("H1 leading dot", () => {
  it(".5 -> 0.5 on blur", async () => {
    expect((await typeBlur({}, ".5")).blurred).toBe("0.5");
  });
});

// ── C3: controlled value external update ─────────────────────────────────────
describe("C3 controlled value sync", () => {
  function Controlled({ initial }: { initial: number | null }) {
    const [v, setV] = useState<number | null>(initial);
    return (
      <div>
        <button type="button" data-testid="set200" onClick={() => setV(200)}>a</button>
        <button type="button" data-testid="setNull" onClick={() => setV(null)}>b</button>
        <button type="button" data-testid="set0" onClick={() => setV(0)}>c</button>
        <NumberField.Root locale="en-US" value={v} onChange={setV}>
          <NumberField.Input data-testid="input" />
        </NumberField.Root>
      </div>
    );
  }
  it("100 -> 200 updates display", async () => {
    const u = userEvent.setup();
    render(<Controlled initial={100} />);
    expect(getInput().value).toBe("100");
    await u.click(screen.getByTestId("set200"));
    expect(getInput().value).toBe("200");
  });
  it("-> null clears display", async () => {
    const u = userEvent.setup();
    render(<Controlled initial={100} />);
    await u.click(screen.getByTestId("setNull"));
    expect(getInput().value).toBe("");
  });
  it("-> 0 shows 0", async () => {
    const u = userEvent.setup();
    render(<Controlled initial={100} />);
    await u.click(screen.getByTestId("set0"));
    expect(getInput().value).toBe("0");
  });
  it("still allows typing (controlled round-trip)", async () => {
    const u = userEvent.setup();
    render(<Controlled initial={null} />);
    const input = getInput();
    await u.click(input);
    await u.type(input, "1234");
    expect(input.value).toBe("1,234");
  });
});

// ── H2: percent typing ───────────────────────────────────────────────────────
describe("H2 percent", () => {
  it("type 50 -> 50% (value 0.5)", async () => {
    const r = await typeBlur({ formatOptions: { style: "percent" } }, "50");
    expect(r.blurred).toBe("50%");
  });
  it("type 12 -> 12%", async () => {
    expect((await typeBlur({ formatOptions: { style: "percent" } }, "12")).blurred).toBe("12%");
  });
});

// ── H4: allowOutOfRange steppers ─────────────────────────────────────────────
describe("H4 allowOutOfRange increment", () => {
  it("ArrowUp past max when allowOutOfRange", async () => {
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" allowOutOfRange maxValue={10} defaultValue={10}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, "{ArrowUp}");
    expect(input.value).toBe("11");
  });
});

// ── H5: constraint flags block live typing ───────────────────────────────────
describe("H5 flags", () => {
  it("allowDecimal:false ignores the dot", async () => {
    const r = await typeBlur({ allowDecimal: false }, "12.5");
    expect(r.blurred).not.toContain(".");
    expect(r.blurred).toBe("125");
  });
  it("allowNegative:false ignores the minus", async () => {
    const r = await typeBlur({ allowNegative: false }, "-5");
    expect(r.blurred).toBe("5");
  });
});

// ── M1 currency regressions must keep working ────────────────────────────────
describe("currency stays correct", () => {
  const USD = { formatOptions: { style: "currency", currency: "USD" } };
  it("1234.56 -> $1,234.56", async () => {
    expect((await typeBlur(USD, "1234.56")).blurred).toBe("$1,234.56");
  });
  it("25 -> $25.00", async () => {
    expect((await typeBlur(USD, "25")).blurred).toBe("$25.00");
  });
  it("1.05 cents -> $1.05 (leading-zero cents)", async () => {
    expect((await typeBlur(USD, "1.05")).blurred).toBe("$1.05");
  });
  it("accounting -1234.56 -> ($1,234.56)", async () => {
    const ACCT = { formatOptions: { style: "currency", currency: "USD", currencySign: "accounting" } };
    expect((await typeBlur(ACCT, "-1234.56")).blurred).toBe("($1,234.56)");
  });
});

// ── edges ────────────────────────────────────────────────────────────────────
describe("edges", () => {
  it("-0 normalizes to 0 on blur", async () => {
    expect((await typeBlur({}, "-0")).blurred).toBe("0");
  });

  it("NEG-5: second leading minus is ignored (stays negative)", async () => {
    // type '-5' then another '-' at the start
    const u = userEvent.setup();
    const input = mount({});
    await u.click(input);
    await u.type(input, "-5");
    input.setSelectionRange(0, 0);
    await u.type(input, "-", { initialSelectionStart: 0, initialSelectionEnd: 0 });
    expect(input.value).toBe("-5");
  });

  it("NEG-6: minus typed mid-string is dropped, value preserved", async () => {
    expect((await typeBlur({}, "1-23")).blurred).toBe("123");
  });

  it("ADV-06: NaN defaultValue does not leak to the form / aria", () => {
    render(
      <NumberField.Root locale="en-US" name="amt" defaultValue={Number.NaN}>
        <NumberField.Input data-testid="input" />
        <NumberField.HiddenInput />
      </NumberField.Root>
    );
    const input = getInput();
    expect(input.value).toBe("");
    expect(input).not.toHaveAttribute("aria-valuenow");
    const hidden = document.querySelector('input[name="amt"]') as HTMLInputElement;
    expect(hidden?.value ?? "").toBe("");
  });

  it("M2: changing locale at runtime reformats the existing value", async () => {
    function Switcher() {
      const [loc, setLoc] = useState("en-US");
      return (
        <div>
          <button type="button" data-testid="toDe" onClick={() => setLoc("de-DE")}>x</button>
          <NumberField.Root locale={loc} defaultValue={1234.5}>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </div>
      );
    }
    const u = userEvent.setup();
    render(<Switcher />);
    expect(getInput().value).toBe("1,234.5");
    await u.click(screen.getByTestId("toDe"));
    expect(getInput().value).toBe("1.234,5");
  });
});

// ── round 2: regressions found by the verification sweep ─────────────────────
describe("round2: controlled NaN must not crash", () => {
  it("value={NaN} mounts as empty without infinite render loop", () => {
    render(
      <NumberField.Root locale="en-US" value={Number.NaN}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    expect(getInput().value).toBe("");
    expect(getInput()).not.toHaveAttribute("aria-valuenow");
  });
  it("value transitions number -> NaN without crashing", async () => {
    function W() {
      const [v, setV] = useState<number>(123);
      return (
        <div>
          <button type="button" data-testid="toNaN" onClick={() => setV(Number.NaN)}>x</button>
          <NumberField.Root locale="en-US" value={v}>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </div>
      );
    }
    const u = userEvent.setup();
    render(<W />);
    expect(getInput().value).toBe("123");
    await u.click(screen.getByTestId("toNaN"));
    expect(getInput().value).toBe("");
  });
});

describe("round2: allowDecimal:false + fixedDecimalScale (XF-2)", () => {
  it("typing an integer is not destroyed", async () => {
    const r = await typeBlur(
      { allowDecimal: false, fixedDecimalScale: true, maximumFractionDigits: 2 },
      "1234"
    );
    expect(r.blurred).toBe("1,234");
  });
});

describe("round2: -0 never leaks as a value", () => {
  it("typing -0 emits 0 (not -0) to onChange", async () => {
    const seen: Array<number | null> = [];
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" onChange={(v) => seen.push(v)}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, "-0");
    const last = seen[seen.length - 1];
    expect(Object.is(last, -0)).toBe(false);
    expect(last).toBe(0);
  });
  it("typing -0.5 still works (minus preserved)", async () => {
    expect((await typeBlur({}, "-0.5")).blurred).toBe("-0.5");
  });
  it("paste -0 shows 0", async () => {
    const u = userEvent.setup();
    const input = mount({});
    await u.click(input);
    await u.paste("-0");
    expect(input.value).toBe("0");
  });
});

describe("round2: sub-microscopic step is not swallowed", () => {
  it("step 1e-7 increments", async () => {
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" defaultValue={0} step={0.0000001} maximumFractionDigits={12}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, "{ArrowUp}");
    expect(input.value).toBe("0.0000001");
  });
});

describe("round2: backspacing all digits clears stranded affordances", () => {
  it("percent: deleting both digits clears the lone %", async () => {
    const u = userEvent.setup();
    const input = mount({ formatOptions: { style: "percent" } });
    await u.click(input);
    await u.type(input, "50");
    expect(input.value).toBe("50%");
    // caret before the "%", backspace both digits
    const pct = input.value.indexOf("%");
    input.setSelectionRange(pct, pct);
    await u.keyboard("{Backspace}{Backspace}");
    expect(input.value).toBe("");
  });
});

describe("round2: smart-backspace caret never strands after a comma", () => {
  it("multi-group 1,234,567 backspace over 2nd comma keeps caret valid", async () => {
    const u = userEvent.setup();
    const input = mount({});
    await u.click(input);
    await u.type(input, "1234567");
    input.setSelectionRange(6, 6); // right after the 2nd comma in "1,234,567"
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("123,567");
    // caret must not sit immediately after a grouping separator
    const caret = input.selectionStart ?? 0;
    expect(input.value[caret - 1]).not.toBe(",");
  });
});

describe("round2: native-digit intermediate display stays native", () => {
  it("fa-IR trailing decimal shows Persian digits, not ASCII", async () => {
    const u = userEvent.setup();
    const input = mount({ locale: "fa-IR" });
    await u.click(input);
    await u.type(input, "۱۲٫"); // 12 then Persian decimal separator
    // no ASCII digits should appear in the transient display
    expect(/[0-9]/.test(input.value)).toBe(false);
    await u.tab();
    expect(input.value).toBe("۱۲"); // commits cleanly
  });
});

// ── round 3: min-fraction live-grouping + fa-IR negative sign ────────────────
describe("round3: min-fraction fields group correctly WHILE typing (no padding accumulation)", () => {
  const USD = { formatOptions: { style: "currency", currency: "USD" } };
  it("currency: typing 1234.56 shows $1,234.56 live (not $1234.5600)", async () => {
    const { typed } = await type(USD, "1234.56");
    expect(typed).toBe("$1,234.56");
  });
  it("currency: typing 1234567 groups live ($1,234,567)", async () => {
    const { typed } = await type(USD, "1234567");
    expect(typed).toBe("$1,234,567");
  });
  it("currency: blur pads to $1,234.00", async () => {
    expect((await typeBlur(USD, "1234")).blurred).toBe("$1,234.00");
  });
  it("minimumFractionDigits:2: typing 1234 groups live as 1,234 (pad on blur)", async () => {
    const r = await typeBlur({ minimumFractionDigits: 2 }, "1234");
    // pre-blur captured inside typeBlur via type(); assert the committed pad
    expect(r.typed).toBe("1,234");
    expect(r.blurred).toBe("1,234.00");
  });
  it("fixedDecimalScale: typing 12.56 stays 12.56 live (no overshoot), blur 12.56", async () => {
    const r = await typeBlur({ fixedDecimalScale: true, maximumFractionDigits: 2 }, "12.56");
    expect(r.typed).toBe("12.56");
    expect(r.blurred).toBe("12.56");
  });
});

describe("round3: fa-IR (U+2212 minus) keeps the negative sign", () => {
  it("typing -5 in fa-IR commits -5", async () => {
    let last: number | null = 999;
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="fa-IR" onChange={(v) => { last = v; }}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, "-۵");
    await u.tab();
    expect(last).toBe(-5);
  });
  it("editing a negative defaultValue keeps the sign", async () => {
    let last: number | null = 999;
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="fa-IR" defaultValue={-5} onChange={(v) => { last = v; }}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    await u.type(input, "۰", { initialSelectionStart: input.value.length });
    await u.tab();
    expect(last).toBe(-50);
  });
});

// ── round 4: percent decimals, locale-probe, controlled -0 ───────────────────
describe("round4: percent decimal typing is not corrupted", () => {
  async function pctType(fo: Record<string, unknown>, text: string) {
    const seen: Array<number | null> = [];
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="en-US" formatOptions={{ style: "percent", ...fo }} onChange={(v) => seen.push(v)}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, text);
    const live = input.value;
    const liveVal = seen[seen.length - 1];
    await u.tab();
    return { live, liveVal, blurred: input.value, blurVal: seen[seen.length - 1] };
  }
  it("default percent: typing 12.55 keeps live precision, no 135% blowup", async () => {
    const r = await pctType({}, "12.55");
    expect(r.live).toBe("12.55%");
    expect(r.liveVal).toBeCloseTo(0.1255, 6);
    expect(r.blurred).toBe("13%"); // rounds to field precision (maxFrac 0)
    expect(r.blurVal).toBeCloseTo(0.13, 6);
  });
  it("percent maxFractionDigits:2: 12.55 -> 12.55% value 0.1255", async () => {
    const r = await pctType({ maximumFractionDigits: 2 }, "12.55");
    expect(r.blurred).toBe("12.55%");
    expect(r.blurVal).toBeCloseTo(0.1255, 6);
  });
});

describe("round4: de-DE percent comma is the decimal separator (locale probe)", () => {
  it("typing 12,5 -> value 0.125 (not 1.25)", async () => {
    let last: number | null = null;
    const u = userEvent.setup();
    render(
      <NumberField.Root locale="de-DE" formatOptions={{ style: "percent", maximumFractionDigits: 2 }} onChange={(v) => { last = v; }}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    );
    const input = getInput();
    await u.click(input);
    await u.type(input, "12,5");
    await u.tab();
    expect(last).toBeCloseTo(0.125, 6);
  });
});

describe("round4: controlled value -0 normalizes to 0", () => {
  it("parent sets value to -0 -> display 0", async () => {
    function W() {
      const [v, setV] = useState<number>(5);
      return (
        <div>
          <button type="button" data-testid="b" onClick={() => setV(-0)}>x</button>
          <NumberField.Root locale="en-US" value={v}>
            <NumberField.Input data-testid="input" />
          </NumberField.Root>
        </div>
      );
    }
    const u = userEvent.setup();
    render(<W />);
    await u.click(screen.getByTestId("b"));
    expect(getInput().value).toBe("0");
  });
});

// ── round 5: percent float, mount -0, notation typing, Arabic currency ───────
describe("round5: percent live display has no float tail", () => {
  it("typing 12.99 shows 12.99% (not 12.990000000000002%)", async () => {
    const u = userEvent.setup();
    const input = mount({ formatOptions: { style: "percent" } });
    await u.click(input);
    await u.type(input, "12.99");
    expect(input.value).toBe("12.99%");
  });
  it("typing 33.33 shows 33.33%", async () => {
    const u = userEvent.setup();
    const input = mount({ formatOptions: { style: "percent" } });
    await u.click(input);
    await u.type(input, "33.33");
    expect(input.value).toBe("33.33%");
  });
});

describe("round5: -0 on initial mount displays 0", () => {
  it("value={-0} mounts as 0", () => {
    render(<NumberField.Root locale="en-US" value={-0}><NumberField.Input data-testid="input" /></NumberField.Root>);
    expect(getInput().value).toBe("0");
  });
  it("defaultValue={-0} mounts as 0", () => {
    render(<NumberField.Root locale="en-US" defaultValue={-0}><NumberField.Input data-testid="input" /></NumberField.Root>);
    expect(getInput().value).toBe("0");
  });
  it("percent value={-0} mounts as 0%", () => {
    render(<NumberField.Root locale="en-US" value={-0} formatOptions={{ style: "percent" }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    expect(getInput().value).toBe("0%");
  });
});

describe("round5: typing into compact/scientific keeps the value", () => {
  async function notationType(fo: Record<string, unknown>, text: string) {
    let last: number | null = null;
    const u = userEvent.setup();
    render(<NumberField.Root locale="en-US" formatOptions={fo} onChange={(v) => { last = v; }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, text);
    const live = input.value;
    await u.tab();
    return { live, blurred: input.value, value: last };
  }
  it("compact 2500 -> live 2500, blur 2.5K, value 2500", async () => {
    const r = await notationType({ notation: "compact" }, "2500");
    expect(r.live).toBe("2500");
    expect(r.blurred).toBe("2.5K");
    expect(r.value).toBe(2500);
  });
  it("scientific 1500 -> value 1500", async () => {
    const r = await notationType({ notation: "scientific" }, "1500");
    expect(r.value).toBe(1500);
    expect(r.blurred).toBe("1.5E3");
  });
  it("engineering 45000 -> value 45000", async () => {
    const r = await notationType({ notation: "engineering" }, "45000");
    expect(r.value).toBe(45000);
  });
});

describe("round5: Arabic currency (symbol embeds ASCII dots) does not clear", () => {
  it("ar-EG EGP typing 1234 keeps the value and does not wipe on blur", async () => {
    let last: number | null = null;
    const u = userEvent.setup();
    render(<NumberField.Root locale="ar-EG" formatOptions={{ style: "currency", currency: "EGP" }} onChange={(v) => { last = v; }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, "1234");
    expect(last).toBe(1234);
    await u.tab();
    expect(input.value).not.toBe("");
    expect(last).toBe(1234);
  });
});

// ── round 6: ASCII "." decimal in non-ASCII locales, paste into notation ─────
describe("round6: ASCII '.' as decimal in non-ASCII-separator locales", () => {
  async function valueOf(locale: string, fo: Record<string, unknown>, text: string) {
    let last: number | null = null;
    const u = userEvent.setup();
    render(<NumberField.Root locale={locale} formatOptions={fo} onChange={(v) => { last = v; }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, text);
    await u.tab();
    return last;
  }
  it("ar-EG plain: typing 250.75 (ASCII dot) -> 250.75", async () => {
    expect(await valueOf("ar-EG", {}, "250.75")).toBeCloseTo(250.75, 6);
  });
  it("fa-IR plain: typing 3.5 (ASCII dot) -> 3.5", async () => {
    expect(await valueOf("fa-IR", {}, "3.5")).toBeCloseTo(3.5, 6);
  });
  it("ar-EG EGP currency: typing 12.50 -> 12.5 (symbol dots untouched)", async () => {
    expect(await valueOf("ar-EG", { style: "currency", currency: "EGP" }, "12.50")).toBeCloseTo(12.5, 6);
  });
  it("fa-IR percent: typing 12.5 -> 0.125", async () => {
    expect(await valueOf("fa-IR", { style: "percent", maximumFractionDigits: 2 }, "12.5")).toBeCloseTo(0.125, 6);
  });
  it("ar-EG native separator still works: 12٫5 -> 12.5", async () => {
    expect(await valueOf("ar-EG", {}, "12٫5")).toBeCloseTo(12.5, 6);
  });
  it("de-DE: '.' stays grouping (1.234 -> 1234)", async () => {
    expect(await valueOf("de-DE", {}, "1.234")).toBe(1234);
  });
});

describe("round6: pasting into notation fields keeps magnitude", () => {
  async function pasteValue(fo: Record<string, unknown>, text: string) {
    let last: number | null = null;
    const u = userEvent.setup();
    render(<NumberField.Root locale="en-US" formatOptions={fo} onChange={(v) => { last = v; }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.paste(text);
    await u.tab();
    return last;
  }
  it("paste 2.5K into compact -> 2500", async () => {
    expect(await pasteValue({ notation: "compact" }, "2.5K")).toBe(2500);
  });
  it("paste 2500 into compact -> 2500", async () => {
    expect(await pasteValue({ notation: "compact" }, "2500")).toBe(2500);
  });
  it("paste 1.5e3 into scientific -> 1500", async () => {
    expect(await pasteValue({ notation: "scientific" }, "1.5e3")).toBe(1500);
  });
});

// ── round 7: live regroup of trailing-zero values, suffix/% backspace ────────
describe("round7: trailing-zero values group the integer part live", () => {
  it("inserting 99 into $12.50 shows $9,912.50 live", async () => {
    const u = userEvent.setup();
    const input = mount({ formatOptions: { style: "currency", currency: "USD" } });
    await u.click(input);
    await u.type(input, "12.50");
    expect(input.value).toBe("$12.50");
    await u.type(input, "99", { initialSelectionStart: 1, initialSelectionEnd: 1 });
    expect(input.value).toBe("$9,912.50");
  });
  it("typing 9912.50 continuously stays grouped", async () => {
    const u = userEvent.setup();
    const input = mount({});
    await u.click(input);
    await u.type(input, "9912.50");
    expect(input.value).toBe("9,912.50");
  });
  it("trailing zeros still preserved while typing (no regression): 1.50", async () => {
    const u = userEvent.setup();
    const input = mount({});
    await u.click(input);
    await u.type(input, "1.50");
    expect(input.value).toBe("1.50");
  });
});

describe("round7: backspacing a trailing affordance deletes the digit", () => {
  it("percent 50% backspace from end -> 5% then empty", async () => {
    const u = userEvent.setup();
    const input = mount({ formatOptions: { style: "percent" } });
    await u.click(input);
    await u.type(input, "50");
    input.setSelectionRange(input.value.length, input.value.length); // caret after %
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("5%");
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("");
  });
  it("suffix ' kg' backspace from end deletes the digit", async () => {
    const u = userEvent.setup();
    const input = mount({ suffix: " kg" });
    await u.click(input);
    await u.type(input, "1234");
    input.setSelectionRange(input.value.length, input.value.length); // caret after 'kg'
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("123 kg");
  });
});

// ── round 8: native-digit affordance backspace, leading-dot caret, comma-bksp ─
describe("round8: affordance backspace works in native-digit locales", () => {
  it("fa-IR percent ۵۰٪ backspace from end -> ۵٪", async () => {
    const u = userEvent.setup();
    render(<NumberField.Root locale="fa-IR" formatOptions={{ style: "percent" }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, "۵۰");
    input.setSelectionRange(input.value.length, input.value.length);
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("۵٪");
  });
  it("fa-IR suffix ' kg' backspace deletes the native digit", async () => {
    const u = userEvent.setup();
    render(<NumberField.Root locale="fa-IR" suffix=" kg"><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, "۱۲۳۴");
    input.setSelectionRange(input.value.length, input.value.length);
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("۱۲۳ kg");
  });
});

describe("round8: leading-dot continuous typing keeps the value (no transposition)", () => {
  async function v(text: string) {
    let last: number | null = null;
    const u = userEvent.setup();
    render(<NumberField.Root locale="en-US" onChange={(x) => { last = x; }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, text);
    await u.tab();
    return last;
  }
  it(".53 -> 0.53 (not 0.35)", async () => expect(await v(".53")).toBeCloseTo(0.53, 6));
  it(".50 -> 0.5", async () => expect(await v(".50")).toBeCloseTo(0.5, 6));
  it(".507 -> 0.507", async () => expect(await v(".507")).toBeCloseTo(0.507, 6));
});

describe("round8: comma-backspace preserves typed trailing zero", () => {
  it("1,234.50 comma-backspace -> 234.50", async () => {
    const u = userEvent.setup();
    const input = mount({});
    await u.click(input);
    await u.type(input, "1234.50");
    input.setSelectionRange(2, 2); // right after the comma
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("234.50");
  });
});

// ── round 9: affordance/comma backspace must not re-pad min-fraction ─────────
describe("round9: backspace does not re-pad min-fraction fields in live display", () => {
  it("de-DE EUR: type 1234, end-backspace -> '123 €' (not '123,00 €')", async () => {
    const u = userEvent.setup();
    render(<NumberField.Root locale="de-DE" formatOptions={{ style: "currency", currency: "EUR" }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, "1234");
    input.setSelectionRange(input.value.length, input.value.length);
    await u.keyboard("{Backspace}");
    // de-DE EUR uses a non-breaking space before €; normalize for comparison.
    expect(input.value.replace(/ /g, " ")).toBe("123 €");
    expect(input.value).not.toContain(",00");
  });
  it("en-US suffix ' kg' + minimumFractionDigits:2: 123 end-backspace -> '12 kg'", async () => {
    const u = userEvent.setup();
    const input = mount({ suffix: " kg", minimumFractionDigits: 2 });
    await u.click(input);
    await u.type(input, "123");
    input.setSelectionRange(input.value.length, input.value.length);
    await u.keyboard("{Backspace}");
    expect(input.value).toBe("12 kg");
  });
  it("ar-EG EGP: repeated end-backspace clears (not stuck on padding zeros)", async () => {
    let last: number | null = -1;
    const u = userEvent.setup();
    render(<NumberField.Root locale="ar-EG" formatOptions={{ style: "currency", currency: "EGP" }} onChange={(v) => { last = v; }}><NumberField.Input data-testid="input" /></NumberField.Root>);
    const input = getInput();
    await u.click(input);
    await u.type(input, "12");
    input.setSelectionRange(input.value.length, input.value.length);
    await u.keyboard("{Backspace}");
    expect(last).toBe(1);
    input.setSelectionRange(input.value.length, input.value.length);
    await u.keyboard("{Backspace}");
    expect(last).toBeNull();
    expect(input.value).toBe("");
  });
});

// ── H3: paste scientific / compact ───────────────────────────────────────────
describe("H3 paste special notations", () => {
  async function paste(props: Record<string, unknown>, text: string) {
    const u = userEvent.setup();
    const input = mount(props);
    await u.click(input);
    await u.paste(text);
    await u.tab();
    return input.value;
  }
  it("paste 1e3 -> 1,000", async () => {
    expect(await paste({}, "1e3")).toBe("1,000");
  });
  it("paste 1.23E4 -> 12,300", async () => {
    expect(await paste({}, "1.23E4")).toBe("12,300");
  });
  it("paste 1.5K compact -> 1,500", async () => {
    expect(await paste({}, "1.5K")).toBe("1,500");
  });
});
