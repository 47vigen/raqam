/**
 * Shared test harness for behavioral (interaction) tests.
 *
 * Design principles — these exist because the *original* suite stayed green
 * through ~25 real bugs:
 *   1. Drive the REAL pipeline. Never call `setInputValue()` / `fireEvent.change`
 *      with a pre-baked string — that skips handleChange → parser → cursor →
 *      display, which is exactly where the typing bugs lived. Always type
 *      character-by-character via a SINGLE continuous `userEvent.type` call so the
 *      caret advances like a real keyboard.
 *   2. Assert the whole truth. Every behavioral check looks at the LIVE display
 *      (pre-blur), the COMMITTED display (post-blur) AND the numeric VALUE
 *      (aria-valuenow / onChange) — display-only assertions miss value corruption
 *      and vice-versa.
 *   3. Normalize i18n whitespace. Currency/grouping use NBSP (U+00A0) and
 *      narrow-NBSP (U+202F) and bidi marks (U+200E/F); compare with `norm()`.
 */
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { NumberFieldRootProps } from "./core/types.js";
import { NumberField } from "./react/NumberField.js";

export interface FieldHarness {
  input: HTMLInputElement;
  user: UserEvent;
  /** Every value delivered to onChange, in order (for sequence assertions). */
  changes: Array<number | null>;
  /** Current numeric value, read from the rendered aria-valuenow (state truth). */
  value(): number | null;
  /** Current display string. */
  display(): string;
  /** Hidden form-input value (only present when a `name` prop is passed). */
  hidden(): string | undefined;
  ariaValueNow(): string | null;
}

/** Render the real NumberField the way a consumer wires it up. */
export function renderField(props: Partial<NumberFieldRootProps> = {}): FieldHarness {
  const changes: Array<number | null> = [];
  const { onChange: userOnChange, ...rest } = props;
  const onChange = (v: number | null) => {
    changes.push(v);
    userOnChange?.(v);
  };
  render(
    // biome-ignore lint/suspicious/noExplicitAny: test props are loosely typed
    <NumberField.Root locale="en-US" {...(rest as any)} onChange={onChange}>
      <NumberField.Label>Amount</NumberField.Label>
      <NumberField.Group>
        <NumberField.Decrement data-testid="dec" />
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="inc" />
      </NumberField.Group>
      {props.name ? <NumberField.HiddenInput /> : null}
    </NumberField.Root>
  );
  const input = screen.getByTestId("input") as HTMLInputElement;
  const av = () => input.getAttribute("aria-valuenow");
  return {
    input,
    user: userEvent.setup(),
    changes,
    value: () => (av() == null ? null : Number(av())),
    display: () => input.value,
    hidden: () =>
      (document.querySelector(`input[name="${props.name}"]`) as HTMLInputElement | null)?.value,
    ariaValueNow: av,
  };
}

/** Collapse NBSP / narrow-NBSP to a normal space and drop bidi marks. */
export function norm(s: string): string {
  return s.replace(/[  ]/g, " ").replace(/[‎‏؜]/g, "");
}

export interface TypeResult {
  /** Display string while still focused (after typing, before blur). */
  liveDisplay: string;
  /** Numeric value while still focused. */
  liveValue: number | null;
  /** Display string after blur (commit). */
  committedDisplay: string;
  /** Numeric value after blur. */
  committedValue: number | null;
  /** Full onChange value sequence. */
  changes: Array<number | null>;
  h: FieldHarness;
}

/**
 * Type `text` into a field as ONE continuous keystroke sequence, then blur.
 * `opts.from` places the caret before typing (for mid-string edits).
 */
export async function type(
  props: Partial<NumberFieldRootProps>,
  text: string,
  opts: { from?: number } = {}
): Promise<TypeResult> {
  const h = renderField(props);
  await h.user.click(h.input);
  if (opts.from != null) {
    h.input.setSelectionRange(opts.from, opts.from);
    await h.user.type(h.input, text, {
      initialSelectionStart: opts.from,
      initialSelectionEnd: opts.from,
    });
  } else {
    await h.user.type(h.input, text);
  }
  const liveDisplay = h.input.value;
  const liveValue = h.value();
  await h.user.tab();
  return {
    liveDisplay,
    liveValue,
    committedDisplay: h.input.value,
    committedValue: h.value(),
    changes: h.changes,
    h,
  };
}

/** Backspace `count` times with the caret at the end of the field. */
export async function backspaceFromEnd(h: FieldHarness, count = 1): Promise<void> {
  for (let i = 0; i < count; i++) {
    h.input.setSelectionRange(h.input.value.length, h.input.value.length);
    await h.user.keyboard("{Backspace}");
  }
}

/** Paste `text` into a freshly-rendered field, then blur. */
export async function paste(
  props: Partial<NumberFieldRootProps>,
  text: string
): Promise<TypeResult> {
  const h = renderField(props);
  await h.user.click(h.input);
  await h.user.paste(text);
  const liveDisplay = h.input.value;
  const liveValue = h.value();
  await h.user.tab();
  return {
    liveDisplay,
    liveValue,
    committedDisplay: h.input.value,
    committedValue: h.value(),
    changes: h.changes,
    h,
  };
}
