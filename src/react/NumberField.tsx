"use client";

import React, { forwardRef, useRef } from "react";
import type {
  NumberFieldRootProps,
  NumberFieldState,
  RenderProp,
  ScrubAreaCursorProps,
  ScrubAreaProps,
} from "../core/types.js";
import { NumberFieldContext, useNumberFieldContext } from "./context.js";
import { useNumberField } from "./useNumberField.js";
import { useNumberFieldState } from "./useNumberFieldState.js";
import { useScrubArea } from "./useScrubArea.js";

// ── Render prop utility ───────────────────────────────────────────────────────

/**
 * Merge component props with a `render` prop.
 * Accepts either a React element or a render function.
 */
function renderWith(
  defaultElement: React.ReactElement,
  render: RenderProp | undefined,
  state: NumberFieldState
): React.ReactElement {
  if (!render) return defaultElement;

  if (typeof render === "function") {
    return render(defaultElement.props as Record<string, unknown>, state);
  }

  // Element form: clone with merged props
  return React.cloneElement(
    render,
    Object.assign(
      {},
      defaultElement.props as Record<string, unknown>,
      render.props as Record<string, unknown>
    )
  );
}

// ── Data attributes helper ────────────────────────────────────────────────────

function stateDataAttrs(
  state: NumberFieldState,
  isInvalid: boolean
): Record<string, string | undefined> {
  const { options } = state;
  return {
    "data-disabled": options.disabled ? "" : undefined,
    "data-readonly": options.readOnly ? "" : undefined,
    "data-required": options.required ? "" : undefined,
    "data-scrubbing": state.isScrubbing ? "" : undefined,
    "data-focused": state.isFocused ? "" : undefined,
    "data-invalid": isInvalid ? "" : undefined,
  };
}

// ── Root ──────────────────────────────────────────────────────────────────────

// HTML attributes that belong on the wrapper div (not passed to state/aria hooks)
const DIV_ONLY_KEYS = new Set([
  "className",
  "style",
  "id",
  "tabIndex",
  "title",
  "role",
  "aria-label",
  "data-testid",
  "onClick",
  "onMouseEnter",
  "onMouseLeave",
]);

function splitProps(props: Record<string, unknown>) {
  const fieldProps: Record<string, unknown> = {};
  const divProps: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (DIV_ONLY_KEYS.has(key) || key.startsWith("data-") || key.startsWith("aria-")) {
      divProps[key] = val;
    } else {
      fieldProps[key] = val;
    }
  }
  return { fieldProps, divProps };
}

const Root = forwardRef<HTMLDivElement, NumberFieldRootProps>(function NumberFieldRoot(
  { children, onValueChange, onValueCommitted, ...allProps },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { fieldProps, divProps } = splitProps(allProps as Record<string, unknown>);
  const props = fieldProps as Omit<
    NumberFieldRootProps,
    "children" | "onValueChange" | "onValueCommitted"
  >;

  // Keep a stable ref to onValueChange so the onChange closure never goes stale
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  // Keep a stable ref to the state object so onChange can read the current reason
  const stateRef = useRef<NumberFieldState | null>(null);

  // Wrap onChange to also fire onValueChange with the tracked reason.
  // This closure captures stateRef (stable) not state (changes each render).
  // _setLastChangeReason is called synchronously BEFORE the state mutation
  // that triggers onChange, so stateRef.current._getLastChangeReason() always
  // returns the correct reason at the time onChange fires.
  const wrappedProps = {
    ...props,
    onChange: (value: number | null) => {
      props.onChange?.(value);
      if (onValueChangeRef.current && stateRef.current) {
        onValueChangeRef.current(value, {
          reason: stateRef.current._getLastChangeReason(),
          formattedValue: stateRef.current.inputValue,
        });
      }
    },
  };

  const state = useNumberFieldState(wrappedProps);
  stateRef.current = state; // always keep stateRef pointing to current state

  const aria = useNumberField(wrappedProps, state, inputRef);

  // Determine if field is invalid (out-of-range or failed validate)
  const isInvalid =
    state.validationState === "invalid" ||
    (state.numberValue !== null &&
      ((props.minValue !== undefined && state.numberValue < props.minValue) ||
        (props.maxValue !== undefined && state.numberValue > props.maxValue)));

  return (
    <NumberFieldContext.Provider value={{ state, aria, inputRef, props: wrappedProps }}>
      <div
        ref={ref}
        {...(divProps as React.HTMLAttributes<HTMLDivElement>)}
        {...stateDataAttrs(state, isInvalid)}
      >
        {children}
      </div>
    </NumberFieldContext.Provider>
  );
});

// ── Label ─────────────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(function NumberFieldLabel(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <label ref={ref} {...aria.labelProps} {...rest}>
      {children}
    </label>
  );
  return renderWith(el, render, state);
});

// ── Group ─────────────────────────────────────────────────────────────────────

interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Group = forwardRef<HTMLDivElement, GroupProps>(function NumberFieldGroup(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <div ref={ref} {...aria.groupProps} {...rest}>
      {children}
    </div>
  );
  return renderWith(el, render, state);
});

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  render?: RenderProp;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function NumberFieldInput(
  { render, ...rest },
  _ref
) {
  const { aria, state, inputRef } = useNumberFieldContext();
  const el = (
    <input ref={inputRef as React.RefObject<HTMLInputElement>} {...aria.inputProps} {...rest} />
  );
  return renderWith(el, render, state);
});

// ── Increment ─────────────────────────────────────────────────────────────────

interface IncrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Increment = forwardRef<HTMLButtonElement, IncrementProps>(function NumberFieldIncrement(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <button ref={ref} {...aria.incrementButtonProps} {...rest}>
      {children ?? "+"}
    </button>
  );
  return renderWith(el, render, state);
});

// ── Decrement ─────────────────────────────────────────────────────────────────

interface DecrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Decrement = forwardRef<HTMLButtonElement, DecrementProps>(function NumberFieldDecrement(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <button ref={ref} {...aria.decrementButtonProps} {...rest}>
      {children ?? "−"}
    </button>
  );
  return renderWith(el, render, state);
});

// ── HiddenInput ───────────────────────────────────────────────────────────────

const HiddenInput = function NumberFieldHiddenInput() {
  const { aria } = useNumberFieldContext();
  if (!aria.hiddenInputProps) return null;
  return <input {...aria.hiddenInputProps} />;
};

// ── ScrubArea ─────────────────────────────────────────────────────────────────

const ScrubArea = forwardRef<HTMLSpanElement, ScrubAreaProps>(function NumberFieldScrubArea(
  { render, children, direction = "horizontal", pixelSensitivity = 4, ...rest },
  ref
) {
  const { state } = useNumberFieldContext();
  const { scrubAreaProps } = useScrubArea(state, { direction, pixelSensitivity });

  const el = (
    <span ref={ref} {...scrubAreaProps} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
      {children}
    </span>
  );
  return renderWith(el, render, state);
});

// ── ScrubAreaCursor ───────────────────────────────────────────────────────────
//
// Renders a custom cursor element positioned at the virtual cursor location
// during pointer lock. Use this to show a drag handle icon while scrubbing.
// Rendered only when isScrubbing is true.

const ScrubAreaCursor = forwardRef<HTMLSpanElement, ScrubAreaCursorProps>(
  function NumberFieldScrubAreaCursor({ render, children, style, ...rest }, ref) {
    const { state } = useNumberFieldContext();

    if (!state.isScrubbing) return null;

    const el = (
      <span
        ref={ref}
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9999,
          ...style,
        }}
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    );
    return renderWith(el, render, state);
  }
);

// ── Description ───────────────────────────────────────────────────────────────

interface DescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const Description = forwardRef<HTMLParagraphElement, DescriptionProps>(
  function NumberFieldDescription({ children, ...rest }, ref) {
    const { aria } = useNumberFieldContext();
    return (
      <p ref={ref} {...aria.descriptionProps} {...rest}>
        {children}
      </p>
    );
  }
);

// ── ErrorMessage ──────────────────────────────────────────────────────────────

interface ErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const ErrorMessage = forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  function NumberFieldErrorMessage({ children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    // If no children provided, fall back to the validation error string (if any)
    const content = children ?? state.validationError ?? null;
    if (!content) return null;
    return (
      <p ref={ref} {...aria.errorMessageProps} {...rest}>
        {content}
      </p>
    );
  }
);

// ── Formatted ─────────────────────────────────────────────────────────────────
//
// Read-only display of the current formatted value. Useful for showing the
// formatted number inline without an editable input (e.g., in a data table).

interface FormattedProps extends React.HTMLAttributes<HTMLSpanElement> {
  render?: RenderProp;
}

const Formatted = forwardRef<HTMLSpanElement, FormattedProps>(function NumberFieldFormatted(
  { render, ...rest },
  ref
) {
  const { state } = useNumberFieldContext();
  const el = (
    <span ref={ref} aria-hidden="true" {...rest}>
      {state.inputValue}
    </span>
  );
  return renderWith(el, render, state);
});

// ── Namespace export ──────────────────────────────────────────────────────────

export const NumberField = {
  Root,
  Label,
  Group,
  Input,
  Increment,
  Decrement,
  HiddenInput,
  ScrubArea,
  ScrubAreaCursor,
  Description,
  ErrorMessage,
  Formatted,
};
