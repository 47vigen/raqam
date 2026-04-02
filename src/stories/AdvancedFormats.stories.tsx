import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { NumberField } from "../react/NumberField.js";
import { useNumberFieldFormat } from "../react/useNumberFieldFormat.js";
import { presets } from "../core/presets.js";

const meta: Meta = {
  title: "Advanced Formats",
  parameters: {
    docs: {
      description: {
        component:
          "Advanced number formatting: accounting (parentheses for negatives), compact notation, scientific notation, and format presets.",
      },
    },
  },
};

export default meta;

const rootStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxWidth: 300,
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
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
};

// ── Accounting format ─────────────────────────────────────────────────────────

export const Accounting: StoryObj = {
  name: "Accounting (parentheses for negatives)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
        Type a negative number. The accounting format shows negatives as (1,234.56).
        numra automatically parses parentheses back to negative values.
      </p>
      <NumberField.Root
        locale="en-US"
        formatOptions={presets.accounting("USD")}
        defaultValue={-1234.56}
        allowNegative
        style={rootStyle}
      >
        <NumberField.Label style={labelStyle}>Balance (USD)</NumberField.Label>
        <div style={inputWrapStyle}>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
    </div>
  ),
};

// ── Compact notation ──────────────────────────────────────────────────────────

export const CompactNotation: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <NumberField.Root
        locale="en-US"
        formatOptions={presets.compact}
        defaultValue={1200000}
        style={rootStyle}
      >
        <NumberField.Label style={labelStyle}>Compact Short (1.2M)</NumberField.Label>
        <div style={inputWrapStyle}>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
      <NumberField.Root
        locale="en-US"
        formatOptions={presets.compactLong}
        defaultValue={3400000}
        style={rootStyle}
      >
        <NumberField.Label style={labelStyle}>Compact Long (3.4 million)</NumberField.Label>
        <div style={inputWrapStyle}>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
    </div>
  ),
};

// ── Scientific notation ───────────────────────────────────────────────────────

export const ScientificNotation: StoryObj = {
  render: () => (
    <NumberField.Root
      locale="en-US"
      formatOptions={presets.scientific}
      defaultValue={602214076000000000000000}
      style={rootStyle}
    >
      <NumberField.Label style={labelStyle}>Scientific notation</NumberField.Label>
      <div style={inputWrapStyle}>
        <NumberField.Input style={inputStyle} />
      </div>
    </NumberField.Root>
  ),
};

// ── Presets showcase ──────────────────────────────────────────────────────────

export const PresetsShowcase: StoryObj = {
  render: () => {
    const value = 1234567.89;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "system-ui, sans-serif" }}>
        <h3 style={{ margin: 0 }}>Format Presets — value: {value}</h3>
        {[
          { label: "currency('USD')", opts: presets.currency("USD"), locale: "en-US" },
          { label: "accounting('USD')", opts: presets.accounting("USD"), locale: "en-US" },
          { label: "percent", opts: presets.percent, locale: "en-US", value: 0.1234 },
          { label: "compact", opts: presets.compact, locale: "en-US" },
          { label: "compactLong", opts: presets.compactLong, locale: "en-US" },
          { label: "scientific", opts: presets.scientific, locale: "en-US" },
          { label: "engineering", opts: presets.engineering, locale: "en-US" },
          { label: "integer", opts: presets.integer, locale: "en-US" },
          { label: "financial", opts: presets.financial, locale: "en-US" },
          { label: "unit('kilometer')", opts: presets.unit("kilometer"), locale: "en-US" },
        ].map(({ label, opts, locale, value: v }) => (
          <PresetRow
            key={label}
            label={label}
            opts={opts}
            locale={locale}
            value={v ?? value}
          />
        ))}
      </div>
    );
  },
};

function PresetRow({
  label,
  opts,
  locale,
  value,
}: {
  label: string;
  opts: Intl.NumberFormatOptions;
  locale: string;
  value: number;
}) {
  const formatted = useNumberFieldFormat(value, { locale, formatOptions: opts });
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 14 }}>
      <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, minWidth: 200 }}>
        {label}
      </code>
      <span style={{ color: "#1d4ed8", fontWeight: 500 }}>{formatted}</span>
    </div>
  );
}

// ── useNumberFieldFormat hook ─────────────────────────────────────────────────

export const DisplayOnlyHook: StoryObj = {
  name: "useNumberFieldFormat (display-only)",
  render: () => {
    const items = [
      { name: "MacBook Pro", price: 2499 },
      { name: "iPhone 15 Pro", price: 1199 },
      { name: "AirPods Pro", price: 249 },
      { name: "iPad Air", price: 599 },
    ];

    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Using <code>useNumberFieldFormat</code> for read-only price display —
          no input state machine overhead.
        </p>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "8px 12px" }}>Product</th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <PriceRow key={item.name} {...item} />
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

function PriceRow({ name, price }: { name: string; price: number }) {
  const formatted = useNumberFieldFormat(price, {
    locale: "en-US",
    formatOptions: { style: "currency", currency: "USD" },
  });
  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: "10px 12px" }}>{name}</td>
      <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {formatted}
      </td>
    </tr>
  );
}

// ── Custom formatter/parser ───────────────────────────────────────────────────

export const CustomFormatterParser: StoryObj = {
  name: "Custom formatValue/parseValue (escape hatch)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "system-ui, sans-serif" }}>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
        Custom format function showing 8 decimal places (for cryptocurrency/scientific use).
      </p>
      <NumberField.Root
        locale="en-US"
        defaultValue={3.14159265}
        formatValue={(v) => v.toFixed(8)}
        parseValue={(s) => {
          const n = parseFloat(s);
          return {
            value: isNaN(n) ? null : n,
            isIntermediate: s.endsWith(".") || /\.\d*0+$/.test(s),
          };
        }}
        style={rootStyle}
      >
        <NumberField.Label style={labelStyle}>Value (8 decimal places)</NumberField.Label>
        <div style={inputWrapStyle}>
          <NumberField.Input style={{ ...inputStyle, fontFamily: "monospace" }} />
        </div>
      </NumberField.Root>
    </div>
  ),
};
