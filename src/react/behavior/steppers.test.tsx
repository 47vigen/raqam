import { describe, it, expect } from "vitest";
import { renderField } from "../../test-utils.js";

// ── Arrow-key stepping ────────────────────────────────────────────────────────

describe("steppers — arrow keys", () => {
  it("ArrowUp increments the value by one step", async () => {
    const h = renderField({ defaultValue: 10, step: 1 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(11);
    expect(h.display()).toBe("11");
  });

  it("ArrowDown decrements the value by one step", async () => {
    const h = renderField({ defaultValue: 10, step: 1 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowDown}");
    expect(h.value()).toBe(9);
    expect(h.display()).toBe("9");
  });

  it("ArrowUp respects a custom step size", async () => {
    const h = renderField({ defaultValue: 100, step: 25 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(125);
    expect(h.display()).toBe("125");
  });

  it("Shift+ArrowUp increments by the large step", async () => {
    const h = renderField({ defaultValue: 0, step: 1, largeStep: 10 });
    await h.user.click(h.input);
    await h.user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(h.value()).toBe(10);
    expect(h.display()).toBe("10");
  });

  it("Shift+ArrowDown decrements by the large step", async () => {
    const h = renderField({ defaultValue: 100, step: 1, largeStep: 10 });
    await h.user.click(h.input);
    await h.user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(h.value()).toBe(90);
    expect(h.display()).toBe("90");
  });

  it("Ctrl+ArrowUp increments by the small step", async () => {
    const h = renderField({ defaultValue: 1, step: 1, smallStep: 0.1 });
    await h.user.click(h.input);
    await h.user.keyboard("{Control>}{ArrowUp}{/Control}");
    expect(h.value()).toBe(1.1);
    expect(h.display()).toBe("1.1");
  });

  it("Ctrl+ArrowDown decrements by the small step", async () => {
    const h = renderField({ defaultValue: 1, step: 1, smallStep: 0.1 });
    await h.user.click(h.input);
    await h.user.keyboard("{Control>}{ArrowDown}{/Control}");
    expect(h.value()).toBe(0.9);
    expect(h.display()).toBe("0.9");
  });

  it("derives the default large step as ten times step", async () => {
    const h = renderField({ defaultValue: 0, step: 2 });
    await h.user.click(h.input);
    await h.user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(h.value()).toBe(20);
    expect(h.display()).toBe("20");
  });

  it("derives the default small step as one tenth of step", async () => {
    const h = renderField({ defaultValue: 0, step: 1 });
    await h.user.click(h.input);
    await h.user.keyboard("{Control>}{ArrowUp}{/Control}");
    expect(h.value()).toBe(0.1);
    expect(h.display()).toBe("0.1");
  });
});

// ── Page / Home / End ─────────────────────────────────────────────────────────

describe("steppers — page and bound keys", () => {
  it("PageUp increments by the large step", async () => {
    const h = renderField({ defaultValue: 0, step: 1, largeStep: 10 });
    await h.user.click(h.input);
    await h.user.keyboard("{PageUp}");
    expect(h.value()).toBe(10);
    expect(h.display()).toBe("10");
  });

  it("PageDown decrements by the large step", async () => {
    const h = renderField({ defaultValue: 100, step: 1, largeStep: 10 });
    await h.user.click(h.input);
    await h.user.keyboard("{PageDown}");
    expect(h.value()).toBe(90);
    expect(h.display()).toBe("90");
  });

  it("Home jumps the value to minValue", async () => {
    const h = renderField({ defaultValue: 50, minValue: 5, maxValue: 100 });
    await h.user.click(h.input);
    await h.user.keyboard("{Home}");
    expect(h.value()).toBe(5);
    expect(h.display()).toBe("5");
  });

  it("End jumps the value to maxValue", async () => {
    const h = renderField({ defaultValue: 50, minValue: 0, maxValue: 95 });
    await h.user.click(h.input);
    await h.user.keyboard("{End}");
    expect(h.value()).toBe(95);
    expect(h.display()).toBe("95");
  });
});

// ── Increment / decrement buttons ─────────────────────────────────────────────

describe("steppers — buttons", () => {
  it("the increment button raises the value by one step", async () => {
    const h = renderField({ defaultValue: 5, step: 1 });
    await h.user.click(h.input.ownerDocument.querySelector('[data-testid="inc"]')!);
    expect(h.value()).toBe(6);
    expect(h.display()).toBe("6");
  });

  it("the decrement button lowers the value by one step", async () => {
    const h = renderField({ defaultValue: 5, step: 1 });
    await h.user.click(h.input.ownerDocument.querySelector('[data-testid="dec"]')!);
    expect(h.value()).toBe(4);
    expect(h.display()).toBe("4");
  });

  it("increment from an empty field starts at one step", async () => {
    const h = renderField({ step: 1 });
    expect(h.value()).toBe(null);
    await h.user.click(h.input.ownerDocument.querySelector('[data-testid="inc"]')!);
    expect(h.value()).toBe(1);
    expect(h.display()).toBe("1");
  });

  it("increment from empty with a custom step starts at that step", async () => {
    const h = renderField({ step: 5 });
    await h.user.click(h.input.ownerDocument.querySelector('[data-testid="inc"]')!);
    expect(h.value()).toBe(5);
    expect(h.display()).toBe("5");
  });
});

// ── Float precision ───────────────────────────────────────────────────────────

describe("steppers — precision", () => {
  it("step 0.1 from 0.2 yields exactly 0.3 (no float drift)", async () => {
    const h = renderField({ defaultValue: 0.2, step: 0.1 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(0.3);
    expect(h.display()).toBe("0.3");
  });

  it("repeated 0.1 steps accumulate without float error", async () => {
    const h = renderField({ defaultValue: 0, step: 0.1 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(h.value()).toBe(0.3);
    expect(h.display()).toBe("0.3");
  });

  it("a sub-microscopic step of 1e-7 actually moves off zero", async () => {
    const h = renderField({ defaultValue: 0, step: 1e-7 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(1e-7);
    expect(h.value()).not.toBe(0);
  });

  it("step 0.1 crossing zero from below yields positive zero, never -0", async () => {
    const h = renderField({ defaultValue: -0.1, step: 0.1 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(0);
    // -0 and 0 are === equal, so distinguish them explicitly.
    expect(Object.is(h.value(), -0)).toBe(false);
    expect(h.display()).toBe("0");
  });
});

// ── Clamping ──────────────────────────────────────────────────────────────────

describe("steppers — clamping", () => {
  it("ArrowUp will not push the value past maxValue", async () => {
    const h = renderField({ defaultValue: 99, step: 5, minValue: 0, maxValue: 100 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(100);
    expect(h.display()).toBe("100");
  });

  it("ArrowDown will not push the value below minValue", async () => {
    const h = renderField({ defaultValue: 3, step: 5, minValue: 0, maxValue: 100 });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowDown}");
    expect(h.value()).toBe(0);
    expect(h.display()).toBe("0");
  });

  it("the increment button stops at maxValue and then disables", async () => {
    const h = renderField({ defaultValue: 99, step: 1, minValue: 0, maxValue: 100 });
    const inc = h.input.ownerDocument.querySelector('[data-testid="inc"]') as HTMLButtonElement;
    await h.user.click(inc);
    expect(h.value()).toBe(100);
    expect(inc.disabled).toBe(true);
  });

  it("the decrement button stops at minValue and then disables", async () => {
    const h = renderField({ defaultValue: 1, step: 1, minValue: 0, maxValue: 100 });
    const dec = h.input.ownerDocument.querySelector('[data-testid="dec"]') as HTMLButtonElement;
    await h.user.click(dec);
    expect(h.value()).toBe(0);
    expect(dec.disabled).toBe(true);
  });

  it("clampBehavior 'none' lets a single arrow step exceed maxValue", async () => {
    const h = renderField({
      defaultValue: 99,
      step: 5,
      minValue: 0,
      maxValue: 100,
      clampBehavior: "none",
    });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    // increment() clamps only when allowOutOfRange is false; here it still clamps on step,
    // but blur with clampBehavior:none must not re-pull it in.
    await h.user.tab();
    expect(h.value()).toBe(100);
  });
});

// ── allowOutOfRange ───────────────────────────────────────────────────────────

describe("steppers — allowOutOfRange", () => {
  it("ArrowUp past maxValue actually exceeds the maximum", async () => {
    const h = renderField({
      defaultValue: 100,
      step: 5,
      minValue: 0,
      maxValue: 100,
      allowOutOfRange: true,
    });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowUp}");
    expect(h.value()).toBe(105);
    expect(h.display()).toBe("105");
  });

  it("the increment button stays enabled after exceeding maxValue", async () => {
    const h = renderField({
      defaultValue: 100,
      step: 5,
      minValue: 0,
      maxValue: 100,
      allowOutOfRange: true,
    });
    const inc = h.input.ownerDocument.querySelector('[data-testid="inc"]') as HTMLButtonElement;
    await h.user.click(inc);
    expect(h.value()).toBe(105);
    expect(inc.disabled).toBe(false);
  });

  it("ArrowDown past minValue actually drops below the minimum", async () => {
    const h = renderField({
      defaultValue: 0,
      step: 5,
      minValue: 0,
      maxValue: 100,
      allowOutOfRange: true,
    });
    await h.user.click(h.input);
    await h.user.keyboard("{ArrowDown}");
    expect(h.value()).toBe(-5);
    expect(h.display()).toBe("-5");
  });
});
