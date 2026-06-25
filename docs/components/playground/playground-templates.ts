import pkg from "raqam/package.json";

/**
 * Pinned to the workspace `raqam` version — the source of truth for releases.
 * Sandpack installs this exact version from npm, so it must be a published version.
 */
export const RAQAM_VERSION: string = pkg.version;

export type PlaygroundTemplateId = "starter" | "currency" | "persian";

export const PLAYGROUND_TEMPLATE_META: {
  id: PlaygroundTemplateId;
  label: string;
}[] = [
  { id: "starter", label: "Starter (quantity)" },
  { id: "currency", label: "Currency (USD)" },
  { id: "persian", label: "Persian (fa-IR)" },
];

const APP_STARTER = `import { NumberField } from "raqam";

export default function App(): JSX.Element {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 320 }}>
      <NumberField.Root locale="en-US" defaultValue={1} minValue={0}>
        <NumberField.Label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          Quantity
        </NumberField.Label>
        <NumberField.Group style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
          <NumberField.Decrement style={{ padding: "8px 12px", border: "none", background: "#f5f5f5", cursor: "pointer" }}>−</NumberField.Decrement>
          <NumberField.Input style={{ flex: 1, padding: "8px 10px", border: "none", outline: "none", minWidth: 80 }} />
          <NumberField.Increment style={{ padding: "8px 12px", border: "none", background: "#f5f5f5", cursor: "pointer" }}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  );
}
`;

const APP_CURRENCY = `import { NumberField } from "raqam";

export default function App(): JSX.Element {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 320 }}>
      <NumberField.Root
        locale="en-US"
        formatOptions={{ style: "currency", currency: "USD" }}
        defaultValue={0}
        minValue={0}
      >
        <NumberField.Label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          Price
        </NumberField.Label>
        <NumberField.Group style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
          <NumberField.Decrement style={{ padding: "8px 12px", border: "none", background: "#f5f5f5", cursor: "pointer" }}>−</NumberField.Decrement>
          <NumberField.Input style={{ flex: 1, padding: "8px 10px", border: "none", outline: "none", minWidth: 80 }} />
          <NumberField.Increment style={{ padding: "8px 12px", border: "none", background: "#f5f5f5", cursor: "pointer" }}>+</NumberField.Increment>
        </NumberField.Group>
        <NumberField.HiddenInput />
      </NumberField.Root>
    </div>
  );
}
`;

const APP_PERSIAN = `import "raqam/locales/fa";
import { NumberField } from "raqam";

export default function App(): JSX.Element {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 320 }}>
      <NumberField.Root locale="fa-IR" defaultValue={0}>
        <NumberField.Label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          مبلغ (fa-IR)
        </NumberField.Label>
        <NumberField.Group style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
          <NumberField.Decrement style={{ padding: "8px 12px", border: "none", background: "#f5f5f5", cursor: "pointer" }}>−</NumberField.Decrement>
          <NumberField.Input
            style={{ flex: 1, padding: "8px 10px", border: "none", outline: "none", minWidth: 80 }}
          />
          <NumberField.Increment style={{ padding: "8px 12px", border: "none", background: "#f5f5f5", cursor: "pointer" }}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  );
}
`;

export const PLAYGROUND_APP_BY_ID: Record<PlaygroundTemplateId, string> = {
  starter: APP_STARTER,
  currency: APP_CURRENCY,
  persian: APP_PERSIAN,
};
