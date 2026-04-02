import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { NumberField } from "../react/NumberField.js";

const meta: Meta = {
  title: "IME & CJK Input",
  parameters: {
    docs: {
      description: {
        component: `
**IME (Input Method Editor) support for CJK languages.**

When users type Chinese, Japanese, or Korean numbers via IME, the browser fires
\`compositionstart\` / \`compositionend\` events wrapping the actual input.
numra suspends live formatting during composition (to avoid corrupting partial
composed characters) and applies full formatting when composition ends.

**How to test:**
1. Switch your OS to a Chinese/Japanese/Korean input method
2. Type numbers using the IME
3. Observe that live formatting is suspended during composition
4. On \`Enter\` (composition commit), the value formats correctly
        `,
      },
    },
  },
};

export default meta;

const fieldStyle: React.CSSProperties = {
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
};

// ── Stories ────────────────────────────────────────────────────────────────────

export const ZhCNInput: StoryObj = {
  name: "Chinese (zh-CN) — Numbers via IME",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "system-ui" }}>
      <div style={{ padding: 12, background: "#fef3c7", borderRadius: 8, fontSize: 13 }}>
        <strong>Test with Chinese IME:</strong> Switch to Chinese input (Pinyin/Wubi),
        type &quot;123456&quot; — the IME may produce characters like &quot;一二三&quot; first.
        numra suspends formatting during composition and applies it after you confirm.
      </div>
      <NumberField.Root
        locale="zh-CN"
        formatOptions={{ style: "currency", currency: "CNY" }}
        defaultValue={1234.56}
        style={fieldStyle}
      >
        <label style={{ fontSize: 13, fontWeight: 500 }}>金额 (Amount in CNY)</label>
        <div style={inputWrapStyle}>
          <NumberField.Input style={inputStyle} lang="zh-CN" />
        </div>
      </NumberField.Root>
    </div>
  ),
};

export const JaJPInput: StoryObj = {
  name: "Japanese (ja-JP) — Numbers via IME",
  render: () => (
    <NumberField.Root
      locale="ja-JP"
      formatOptions={{ style: "currency", currency: "JPY" }}
      defaultValue={123456}
      style={fieldStyle}
    >
      <label style={{ fontSize: 13, fontWeight: 500 }}>金額 (Amount in JPY)</label>
      <div style={inputWrapStyle}>
        <NumberField.Input style={inputStyle} lang="ja-JP" />
      </div>
    </NumberField.Root>
  ),
};

export const KoKRInput: StoryObj = {
  name: "Korean (ko-KR) — Numbers via IME",
  render: () => (
    <NumberField.Root
      locale="ko-KR"
      formatOptions={{ style: "currency", currency: "KRW" }}
      defaultValue={1234567}
      style={fieldStyle}
    >
      <label style={{ fontSize: 13, fontWeight: 500 }}>금액 (Amount in KRW)</label>
      <div style={inputWrapStyle}>
        <NumberField.Input style={inputStyle} lang="ko-KR" />
      </div>
    </NumberField.Root>
  ),
};

export const IMEDisabledLiveFormat: StoryObj = {
  name: "IME without live format (comparison)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 8, fontSize: 13 }}>
        When <code>liveFormat=false</code>, formatting only applies on blur.
        This is a simpler mode that avoids any IME complexity.
      </div>
      <NumberField.Root
        locale="ja-JP"
        formatOptions={{ style: "currency", currency: "JPY" }}
        liveFormat={false}
        defaultValue={1000000}
        style={fieldStyle}
      >
        <label style={{ fontSize: 13, fontWeight: 500 }}>Format on blur only</label>
        <div style={inputWrapStyle}>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
    </div>
  ),
};
