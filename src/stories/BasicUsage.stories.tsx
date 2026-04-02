import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { NumberField } from "../react/NumberField.js";
import { useNumberFieldFormat } from "../react/useNumberFieldFormat.js";

const meta = {
  title: "numra/Basic Usage",
  component: NumberField.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const groupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #ccc",
  borderRadius: 6,
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 10px",
  fontSize: 14,
  border: "none",
  outline: "none",
  minWidth: 100,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "#f5f5f5",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  userSelect: "none",
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#555" };

function Field(props: React.ComponentProps<typeof NumberField.Root>) {
  return (
    <NumberField.Root {...props}>
      <div style={fieldStyle}>
        <NumberField.Label style={labelStyle}>Amount</NumberField.Label>
        <NumberField.Group style={groupStyle}>
          <NumberField.Decrement style={btnStyle}>−</NumberField.Decrement>
          <NumberField.Input style={inputStyle} />
          <NumberField.Increment style={btnStyle}>+</NumberField.Increment>
        </NumberField.Group>
      </div>
    </NumberField.Root>
  );
}

export const Default: Story = {
  render: () => <Field locale="en-US" defaultValue={0} />,
};

export const WithMinMax: Story = {
  render: () => <Field locale="en-US" defaultValue={50} minValue={0} maxValue={100} />,
};

export const WithStep: Story = {
  render: () => <Field locale="en-US" defaultValue={0} step={5} />,
};

export const Disabled: Story = {
  render: () => <Field locale="en-US" defaultValue={42} disabled />,
};

export const ReadOnly: Story = {
  render: () => <Field locale="en-US" defaultValue={42} readOnly />,
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(0);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "system-ui" }}>
        <Field locale="en-US" value={value} onChange={setValue} />
        <div style={{ fontSize: 13, color: "#666" }}>
          Raw value: <code>{String(value)}</code>
        </div>
        <button onClick={() => setValue(100)} style={{ width: "fit-content" }}>
          Set to 100
        </button>
      </div>
    );
  },
};

export const AllowOutOfRange: Story = {
  name: "Allow Out Of Range (server validation)",
  render: () => {
    const [value, setValue] = useState<number | null>(50);
    const isInvalid = value !== null && (value < 0 || value > 100);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "system-ui" }}>
        <NumberField.Root
          locale="en-US"
          value={value}
          onChange={setValue}
          minValue={0}
          maxValue={100}
          allowOutOfRange
        >
          <div style={fieldStyle}>
            <NumberField.Label style={labelStyle}>Score (0–100, server validates)</NumberField.Label>
            <NumberField.Group
              style={{
                ...groupStyle,
                borderColor: isInvalid ? "#e53e3e" : "#ccc",
              }}
            >
              <NumberField.Decrement style={btnStyle}>−</NumberField.Decrement>
              <NumberField.Input style={inputStyle} />
              <NumberField.Increment style={btnStyle}>+</NumberField.Increment>
            </NumberField.Group>
            {isInvalid && (
              <NumberField.ErrorMessage style={{ fontSize: 12, color: "#e53e3e" }}>
                Value must be between 0 and 100
              </NumberField.ErrorMessage>
            )}
          </div>
        </NumberField.Root>
      </div>
    );
  },
};

export const PressAndHold: Story = {
  name: "Press-and-Hold Acceleration",
  render: () => (
    <div style={{ fontFamily: "system-ui", fontSize: 13, color: "#555" }}>
      <p>Hold the +/− buttons — value accelerates after 400ms</p>
      <Field locale="en-US" defaultValue={0} stepHoldDelay={400} stepHoldInterval={200} />
    </div>
  ),
};

export const DataFocusedStyling: StoryObj = {
  name: "data-focused CSS styling",
  render: () => (
    <div style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        .numra-demo[data-focused] .numra-group {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .numra-demo[data-invalid] .numra-group {
          border-color: #dc2626;
        }
      `}</style>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
        Click the input — CSS styles automatically via <code>data-focused</code> attribute.
        No JS class toggling needed.
      </p>
      <NumberField.Root
        locale="en-US"
        defaultValue={42}
        className="numra-demo"
      >
        <NumberField.Label style={{ fontSize: 13, fontWeight: 500 }}>
          Amount
        </NumberField.Label>
        <NumberField.Group
          className="numra-group"
          style={{
            display: "flex",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            overflow: "hidden",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        >
          <NumberField.Decrement style={{ padding: "8px 12px", background: "#f9fafb", border: "none", cursor: "pointer" }}>−</NumberField.Decrement>
          <NumberField.Input style={{ flex: 1, padding: "8px 12px", border: "none", outline: "none", fontSize: 16 }} />
          <NumberField.Increment style={{ padding: "8px 12px", background: "#f9fafb", border: "none", cursor: "pointer" }}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
};

export const FormattedDisplayComponent: StoryObj = {
  name: "NumberField.Formatted (read-only display)",
  render: () => {
    const [value, setValue] = useState<number | null>(1234567.89);
    const displayFormatted = useNumberFieldFormat(value, {
      locale: "en-US",
      formatOptions: { style: "currency", currency: "USD" },
    });

    return (
      <div style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: 12, background: "#f0f9ff", borderRadius: 8, fontSize: 14 }}>
          <strong>Input hook output:</strong> {displayFormatted}
        </div>
        <NumberField.Root
          locale="en-US"
          formatOptions={{ style: "currency", currency: "USD" }}
          value={value}
          onChange={setValue}
        >
          <NumberField.Label style={{ fontSize: 13, fontWeight: 500 }}>
            Edit value
          </NumberField.Label>
          <div style={{ display: "flex", border: "1px solid #ccc", borderRadius: 6 }}>
            <NumberField.Input style={{ flex: 1, padding: "8px 12px", border: "none", outline: "none", fontSize: 16 }} />
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Formatted display: <NumberField.Formatted style={{ fontWeight: 600, color: "#111" }} />
          </div>
        </NumberField.Root>
      </div>
    );
  },
};
