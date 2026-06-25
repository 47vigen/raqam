import { defineConfig } from "tsup";
import { readFileSync, writeFileSync } from "fs";

/** Prepend "use client" to client-facing bundles after build */
async function prependUseClient() {
  const files = [
    "dist/index.js",
    "dist/index.cjs",
    "dist/react.js",
    "dist/react.cjs",
  ];
  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      if (!content.startsWith('"use client"')) {
        writeFileSync(file, '"use client";\n' + content);
      }
    } catch {
      // File may not exist in a partial build
    }
  }
}

// Single config with code-splitting so shared modules — the normalizer's
// registerLocale registry and the React context — are emitted ONCE as a common
// chunk imported by every entry, instead of each entry inlining its own copy.
// Without this, `registerLocale` on one entry didn't affect parsers from another
// and `NumberFieldContext` had a different identity per entry (ESM). (Code
// splitting applies to the ESM output; the CJS output still inlines per entry.)
export default defineConfig({
  entry: {
    index: "src/index.ts",
    react: "src/react/index.ts",
    // Core stays server-safe: it shares the universal chunk but never the React
    // one, and the "use client" banner below is only added to index/react.
    core: "src/core/index.ts",
    "locales/fa": "src/locales/fa.ts",
    "locales/ar": "src/locales/ar.ts",
    "locales/bn": "src/locales/bn.ts",
    "locales/hi": "src/locales/hi.ts",
    "locales/th": "src/locales/th.ts",
    "locales/index": "src/locales/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  outExtension: ({ format }) => ({
    js: format === "cjs" ? ".cjs" : ".js",
  }),
  treeshake: true,
  splitting: true,
  minify: true,
  async onSuccess() {
    await prependUseClient();
  },
});
