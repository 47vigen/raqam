/**
 * MODULE: editing — smart-backspace over grouping separators, affordance
 * (percent/suffix) backspace, native-digit affordance backspace, comma-backspace
 * trailing-zero preservation, mid-string re-grouping, select-all + retype, and
 * smart-decimal jump on fixedDecimalScale.
 *
 * Every test drives the REAL pipeline via renderField + user.type / keyboard /
 * setSelectionRange / backspaceFromEnd. Each typing scenario asserts BOTH the
 * display AND the numeric value. The source is correct — green == correct.
 */
import { describe, it, expect } from "vitest";
import { renderField, backspaceFromEnd, norm } from "../../test-utils.js";
import "../../locales/fa.js";

describe("editing: smart-backspace over a grouping separator", () => {
  it("backspacing the caret sitting just after a comma deletes the digit before it (1,234 -> 234)", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "1234");
    expect(h.display()).toBe("1,234");

    // Caret immediately after the comma in "1,234".
    const commaPos = h.display().indexOf(",") + 1;
    h.input.setSelectionRange(commaPos, commaPos);
    await h.user.keyboard("{Backspace}");

    expect(h.display()).toBe("234");
    expect(h.value()).toBe(234);
    // Caret must NOT be stranded immediately after a grouping separator.
    const caret = h.input.selectionStart ?? 0;
    expect(h.display()[caret - 1]).not.toBe(",");
  });

  it("multi-group 1,234,567 backspace over the 2nd comma yields 123,567 with a valid caret", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "1234567");
    expect(h.display()).toBe("1,234,567");

    // Caret right after the 2nd comma (index 6 in "1,234,567").
    h.input.setSelectionRange(6, 6);
    await h.user.keyboard("{Backspace}");

    expect(h.display()).toBe("123,567");
    expect(h.value()).toBe(123567);
    const caret = h.input.selectionStart ?? 0;
    expect(h.display()[caret - 1]).not.toBe(",");
  });

  it("comma-backspace preserves a typed trailing zero (1,234.50 -> 234.50)", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "1234.50");
    expect(h.display()).toBe("1,234.50");

    // Caret right after the comma (index 2 in "1,234.50").
    h.input.setSelectionRange(2, 2);
    await h.user.keyboard("{Backspace}");

    expect(h.display()).toBe("234.50");
    expect(h.value()).toBe(234.5);
  });
});

describe("editing: backspacing over a trailing affordance deletes the digit", () => {
  it("percent 50% backspace-from-end deletes the digit (50% -> 5% -> empty)", async () => {
    const h = renderField({ formatOptions: { style: "percent" } });
    await h.user.click(h.input);
    await h.user.type(h.input, "50");
    expect(h.display()).toBe("50%");
    expect(h.value()).toBe(0.5);

    await backspaceFromEnd(h, 1); // caret after %, delete the trailing digit
    expect(h.display()).toBe("5%");
    expect(h.value()).toBe(0.05);

    await backspaceFromEnd(h, 1);
    expect(h.display()).toBe("");
    expect(h.value()).toBe(null);
  });

  it("suffix ' kg' backspace-from-end deletes the digit (1,234 kg -> 123 kg)", async () => {
    const h = renderField({ suffix: " kg" });
    await h.user.click(h.input);
    await h.user.type(h.input, "1234");
    expect(norm(h.display())).toBe("1,234 kg");
    expect(h.value()).toBe(1234);

    await backspaceFromEnd(h, 1); // caret after 'kg', delete the trailing digit
    expect(norm(h.display())).toBe("123 kg");
    expect(h.value()).toBe(123);
  });
});

describe("editing: native-digit affordance backspace (fa-IR)", () => {
  it("fa-IR percent ۵۰٪ backspace-from-end deletes the native digit (-> ۵٪)", async () => {
    const h = renderField({ locale: "fa-IR", formatOptions: { style: "percent" } });
    await h.user.click(h.input);
    await h.user.type(h.input, "۵۰");
    expect(h.display()).toBe("۵۰٪");
    expect(h.value()).toBe(0.5);

    await backspaceFromEnd(h, 1);
    expect(h.display()).toBe("۵٪");
    expect(h.value()).toBe(0.05);
  });
});

describe("editing: mid-string delete re-groups the integer part", () => {
  it("deleting a digit from 1,234,567 re-groups to 134,567", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "1234567");
    expect(h.display()).toBe("1,234,567");

    // Place caret right after the "2" (index 3 in "1,234,567") and backspace it.
    h.input.setSelectionRange(3, 3);
    await h.user.keyboard("{Backspace}");

    expect(h.display()).toBe("134,567");
    expect(h.value()).toBe(134567);
  });
});

describe("editing: select-all + retype commits the new value", () => {
  it("clearing 1,234 and typing 99 commits 99", async () => {
    const h = renderField({});
    await h.user.click(h.input);
    await h.user.type(h.input, "1234");
    expect(h.display()).toBe("1,234");
    expect(h.value()).toBe(1234);

    await h.user.clear(h.input);
    await h.user.type(h.input, "99");
    expect(h.display()).toBe("99");

    await h.user.tab();
    expect(h.display()).toBe("99");
    expect(h.value()).toBe(99);
  });
});

describe("editing: smart-decimal jump on fixedDecimalScale", () => {
  it("typing the decimal separator into 1.00 jumps the caret past it so the next digit lands in the fraction (1.00 -> 1.50)", async () => {
    const h = renderField({ fixedDecimalScale: true, maximumFractionDigits: 2 });
    await h.user.click(h.input);
    await h.user.type(h.input, "1");
    await h.user.tab(); // commit -> pads to 1.00
    expect(h.display()).toBe("1.00");
    expect(h.value()).toBe(1);

    // Re-focus, place caret right after the "1" (before the "."), then type
    // "." which should jump past the existing decimal separator, then "5".
    await h.user.click(h.input);
    h.input.setSelectionRange(1, 1);
    await h.user.keyboard(".");
    await h.user.keyboard("5");

    expect(h.display()).toBe("1.50");
    await h.user.tab();
    expect(h.display()).toBe("1.50");
    expect(h.value()).toBe(1.5);
  });
});
