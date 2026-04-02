"use client";

import React, { forwardRef, useRef } from "react";
import type {
  NumberFieldRootProps,
  NumberFieldState,
  RenderProp,
} from "../core/types.js";
import { NumberFieldContext, useNumberFieldContext } from "./context.js";
import { useNumberFieldState } from "./useNumberFieldState.js";
import { useNumberField } from "./useNumberField.js";

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
  return React.cloneElement(render, Object.assign(
    {},
    defaultElement.props as Record<string, unknown>,
    render.props as Record<string, unknown>
  ));
}

// ── Data attributes helper ────────────────────────────────────────────────────

function stateDataAttrs(state: NumberFieldState): Record<string, string | undefined> {
  const { options } = state;
  return {
    "data-disabled": options.disabled ? "" : undefined,
    "data-readonly": options.readOnly ? "" : undefined,
    "data-required": options.required ? "" : undefined,
  };
}

// ── Root ──────────────────────────────────────────────────────────────────────

const Root = forwardRef<HTMLDivElement, NumberFieldRootProps>(
  function NumberFieldRoot({ children, onValueChange, onValueCommitted, ...props }, ref) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Wrap onChange to also fire onValueChange with details
    const wrappedProps = {
      ...props,
      onChange: (value: number | null) => {
        props.onChange?.(value);
        onValueChange?.(value, {
          reason: "input",
          formattedValue: "",
        });
      },
    };

    const state = useNumberFieldState(wrappedProps);
    const aria = useNumberField(wrappedProps, state, inputRef);

    return (
      <NumberFieldContext.Provider value={{ state, aria, inputRef, props: wrappedProps }}>
        <div ref={ref} {...stateDataAttrs(state)}>
          {children}
        </div>
      </NumberFieldContext.Provider>
    );
  }
);

// ── Label ─────────────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  function NumberFieldLabel({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <label ref={ref} {...aria.labelProps} {...rest}>
        {children}
      </label>
    );
    return renderWith(el, render, state);
  }
);

// ── Group ─────────────────────────────────────────────────────────────────────

interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Group = forwardRef<HTMLDivElement, GroupProps>(
  function NumberFieldGroup({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <div ref={ref} {...aria.groupProps} {...rest}>
        {children}
      </div>
    );
    return renderWith(el, render, state);
  }
);

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  render?: RenderProp;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function NumberFieldInput({ render, ...rest }, _ref) {
    const { aria, state, inputRef } = useNumberFieldContext();
    const el = (
      <input ref={inputRef} {...aria.inputProps} {...rest} />
    );
    return renderWith(el, render, state);
  }
);

// ── Increment ─────────────────────────────────────────────────────────────────

interface IncrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Increment = forwardRef<HTMLButtonElement, IncrementProps>(
  function NumberFieldIncrement({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <button ref={ref} {...aria.incrementButtonProps} {...rest}>
        {children ?? "+"}
      </button>
    );
    return renderWith(el, render, state);
  }
);

// ── Decrement ─────────────────────────────────────────────────────────────────

interface DecrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Decrement = forwardRef<HTMLButtonElement, DecrementProps>(
  function NumberFieldDecrement({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <button ref={ref} {...aria.decrementButtonProps} {...rest}>
        {children ?? "−"}
      </button>
    );
    return renderWith(el, render, state);
  }
);

// ── HiddenInput ───────────────────────────────────────────────────────────────

const HiddenInput = function NumberFieldHiddenInput() {
  const { aria } = useNumberFieldContext();
  if (!aria.hiddenInputProps) return null;
  return <input {...aria.hiddenInputProps} />;
};

// ── Namespace export ──────────────────────────────────────────────────────────

export const NumberField = {
  Root,
  Label,
  Group,
  Input,
  Increment,
  Decrement,
  HiddenInput,
};
