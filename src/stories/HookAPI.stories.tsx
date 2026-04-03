import type { Meta, StoryObj } from "@storybook/react";
import React, { useRef } from "react";
import { useNumberFieldState } from "../react/useNumberFieldState.js";
import { useNumberField } from "../react/useNumberField.js";

const meta: Meta = {
  title: "numra/Hook API",
  parameters: {
    docs: {
      description: {
        component: [
          "Use `useNumberFieldState` + `useNumberField` directly when you need full control over the DOM.",
          "This is the low-level API that `NumberField.*` components are built on.",
          "",
          "The hook pair gives you prop objects (ARIA attributes, event handlers) that you spread",
          "onto your own elements — no compound components required.",
        ].join("\n"),
      },
    },
  },
};

export default meta;

// ── Shared styles ─────────────────────────────────────────────────────────────

const wrapStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const groupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  fontSize: 16,
  border: "none",
  outline: "none",
  background: "transparent",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "#f9fafb",
  border: "none",
  borderLeft: "1px solid #e5e7eb",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  userSelect: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
};

// ── Stories ────────────────────────────────────────────────────────────────────

/**
 * Minimal usage of the two hooks. This is equivalent to `<NumberField.Root>`.
 */
export const MinimalHookUsage: StoryObj = {
  name: "Minimal hook usage",
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const state = useNumberFieldState({
      locale: "en-US",
      defaultValue: 42,
    });

    const { labelProps, groupProps, inputProps, incrementButtonProps, decrementButtonProps } =
      useNumberField({ locale: "en-US" }, state, inputRef);

    return (
      <div style={wrapStyle}>
        <label {...labelProps} style={labelStyle}>
          Amount
        </label>
        <div {...groupProps} style={groupStyle}>
          <button {...decrementButtonProps} style={{ ...btnStyle, borderLeft: "none", borderRight: "1px solid #e5e7eb" }}>
            −
          </button>
          <input {...inputProps} ref={inputRef} style={inputStyle} />
          <button {...incrementButtonProps} style={btnStyle}>
            +
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          numberValue: <code>{String(state.numberValue)}</code>
        </div>
      </div>
    );
  },
};

/**
 * Access all state properties and callbacks for custom logic.
 */
export const StateInspector: StoryObj = {
  name: "State inspector",
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const state = useNumberFieldState({
      locale: "en-US",
      formatOptions: { style: "currency", currency: "USD" },
      defaultValue: 1234.56,
      minValue: 0,
      maxValue: 9999,
      step: 100,
    });

    const { labelProps, groupProps, inputProps, incrementButtonProps, decrementButtonProps } =
      useNumberField(
        {
          locale: "en-US",
          formatOptions: { style: "currency", currency: "USD" },
          minValue: 0,
          maxValue: 9999,
          step: 100,
        },
        state,
        inputRef,
      );

    const rows: Array<[string, React.ReactNode]> = [
      ["inputValue", <code key="iv">{JSON.stringify(state.inputValue)}</code>],
      ["numberValue", <code key="nv">{String(state.numberValue)}</code>],
      ["isFocused", <code key="f">{String(state.isFocused)}</code>],
      ["isScrubbing", <code key="s">{String(state.isScrubbing)}</code>],
      ["canIncrement", <code key="ci">{String(state.canIncrement)}</code>],
      ["canDecrement", <code key="cd">{String(state.canDecrement)}</code>],
      ["validationState", <code key="vs">{state.validationState}</code>],
    ];

    return (
      <div style={{ ...wrapStyle, maxWidth: 360 }}>
        <label {...labelProps} style={labelStyle}>
          Budget (USD, 0–$9,999, step $100)
        </label>
        <div {...groupProps} style={groupStyle}>
          <button {...decrementButtonProps} style={{ ...btnStyle, borderLeft: "none", borderRight: "1px solid #e5e7eb" }}>
            −
          </button>
          <input {...inputProps} ref={inputRef} style={inputStyle} />
          <button {...incrementButtonProps} style={btnStyle}>
            +
          </button>
        </div>

        <table
          style={{
            fontSize: 12,
            borderCollapse: "collapse",
            width: "100%",
            fontFamily: "monospace",
          }}
        >
          <tbody>
            {rows.map(([key, value]) => (
              <tr key={key}>
                <td style={{ padding: "3px 8px", color: "#6b7280", background: "#f9fafb" }}>{key}</td>
                <td style={{ padding: "3px 8px" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

/**
 * Build a custom scrub handle — hook API lets you wire useScrubArea yourself.
 */
export const CustomInputOnly: StoryObj = {
  name: "Input-only (no stepper buttons)",
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const state = useNumberFieldState({
      locale: "en-US",
      formatOptions: { maximumFractionDigits: 2 },
      defaultValue: 0,
    });

    const { labelProps, inputProps } = useNumberField(
      { locale: "en-US", formatOptions: { maximumFractionDigits: 2 } },
      state,
      inputRef,
    );

    return (
      <div style={wrapStyle}>
        <label {...labelProps} style={labelStyle}>
          Measurement (no stepper)
        </label>
        <input
          {...inputProps}
          ref={inputRef}
          style={{
            ...inputStyle,
            border: "1px solid #d1d5db",
            borderRadius: 6,
          }}
        />
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
          Use ↑/↓ arrow keys or scroll wheel to change the value.
        </p>
      </div>
    );
  },
};

/**
 * Custom onChange — wire the numeric value directly into your state manager.
 */
export const WithOnChange: StoryObj = {
  name: "Controlled with onChange",
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [log, setLog] = React.useState<string[]>([]);

    const state = useNumberFieldState({
      locale: "en-US",
      defaultValue: 100,
      onChange(value) {
        setLog((prev) => [`onChange(${value})`, ...prev].slice(0, 5));
      },
    });

    const { labelProps, groupProps, inputProps, incrementButtonProps, decrementButtonProps } =
      useNumberField({ locale: "en-US" }, state, inputRef);

    return (
      <div style={{ ...wrapStyle, maxWidth: 280 }}>
        <label {...labelProps} style={labelStyle}>
          Quantity
        </label>
        <div {...groupProps} style={groupStyle}>
          <button {...decrementButtonProps} style={{ ...btnStyle, borderLeft: "none", borderRight: "1px solid #e5e7eb" }}>
            −
          </button>
          <input {...inputProps} ref={inputRef} style={inputStyle} />
          <button {...incrementButtonProps} style={btnStyle}>
            +
          </button>
        </div>
        {log.length > 0 && (
          <div style={{ fontSize: 12, color: "#374151" }}>
            <strong>onChange log:</strong>
            {log.map((entry, i) => (
              <div key={i} style={{ fontFamily: "monospace", color: "#6b7280" }}>{entry}</div>
            ))}
          </div>
        )}
      </div>
    );
  },
};
