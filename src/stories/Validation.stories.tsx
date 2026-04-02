import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { NumberField } from "../react/NumberField.js";

const meta: Meta = {
  title: "Validation",
  parameters: {
    docs: {
      description: {
        component:
          "Custom validation with the `validate` prop. Returns `true` for valid, `false` for invalid, or a `string` for an error message.",
      },
    },
  },
};

export default meta;

// ── Shared styles ──────────────────────────────────────────────────────────────

const rootStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxWidth: 280,
};

const inputWrapStyle: React.CSSProperties = {
  display: "flex",
  border: "1px solid #ccc",
  borderRadius: 6,
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

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#374151",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#dc2626",
};

// ── Stories ────────────────────────────────────────────────────────────────────

export const Required: StoryObj = {
  render: () => (
    <NumberField.Root
      locale="en-US"
      validate={(v) => v === null ? "This field is required" : true}
      style={rootStyle}
    >
      <NumberField.Label style={labelStyle}>Quantity</NumberField.Label>
      <div style={inputWrapStyle}>
        <NumberField.Input style={inputStyle} placeholder="Enter a number" />
      </div>
      <NumberField.ErrorMessage style={errorStyle} />
    </NumberField.Root>
  ),
};

export const MinimumValue: StoryObj = {
  render: () => (
    <NumberField.Root
      locale="en-US"
      minValue={0}
      defaultValue={-5}
      validate={(v) => {
        if (v === null) return "Required";
        if (v < 0) return "Must be a positive number";
        if (v > 1000) return "Cannot exceed 1,000";
        return true;
      }}
      style={rootStyle}
    >
      <NumberField.Label style={labelStyle}>Price (0–1000)</NumberField.Label>
      <div style={inputWrapStyle}>
        <NumberField.Input style={inputStyle} />
      </div>
      <NumberField.ErrorMessage style={errorStyle} />
    </NumberField.Root>
  ),
};

export const EvenNumbersOnly: StoryObj = {
  render: () => (
    <NumberField.Root
      locale="en-US"
      defaultValue={3}
      validate={(v) =>
        v !== null && v % 2 !== 0 ? "Must be an even number" : true
      }
      style={rootStyle}
    >
      <NumberField.Label style={labelStyle}>Even number</NumberField.Label>
      <div style={inputWrapStyle}>
        <NumberField.Input style={inputStyle} />
      </div>
      <NumberField.ErrorMessage style={errorStyle} />
    </NumberField.Root>
  ),
};

export const ReactHookFormIntegration: StoryObj = {
  render: () => {
    // Simulated form state without react-hook-form for demo purposes
    // In real usage: import { Controller } from 'react-hook-form'
    const [value, setValue] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validate = (v: number | null) => {
      if (v === null) return "Amount is required";
      if (v < 1) return "Minimum is $1.00";
      if (v > 10000) return "Maximum is $10,000.00";
      return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const result = validate(value);
      if (result !== true) {
        setError(typeof result === "string" ? result : "Invalid");
        return;
      }
      setError(null);
      setSubmitted(true);
    };

    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 280 }}>
        <NumberField.Root
          locale="en-US"
          formatOptions={{ style: "currency", currency: "USD" }}
          value={value}
          onChange={setValue}
          validate={validate}
          style={rootStyle}
        >
          <NumberField.Label style={labelStyle}>Donation amount</NumberField.Label>
          <div style={inputWrapStyle}>
            <NumberField.Input style={inputStyle} />
          </div>
          <NumberField.ErrorMessage style={errorStyle} />
        </NumberField.Root>
        {error && <p style={{ color: "#dc2626", fontSize: 12 }}>{error}</p>}
        {submitted && (
          <p style={{ color: "#16a34a", fontSize: 14 }}>
            ✓ Submitted: {value?.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </p>
        )}
        <button type="submit" style={{ padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
          Donate
        </button>
      </form>
    );
  },
};
