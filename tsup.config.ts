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

export default defineConfig([
  // Core: server-safe, no React, no "use client" banner
  {
    entry: {
      core: "src/core/index.ts",
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
    splitting: false,
    minify: true,
  },
  // React + index: client-only, gets "use client" prepended via onSuccess
  {
    entry: {
      index: "src/index.ts",
      react: "src/react/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    outExtension: ({ format }) => ({
      js: format === "cjs" ? ".cjs" : ".js",
    }),
    treeshake: true,
    splitting: false,
    minify: true,
    async onSuccess() {
      await prependUseClient();
    },
  },
  // Locale plugins — separate entries for tree-shaking
  {
    entry: {
      "locales/fa": "src/locales/fa.ts",
      "locales/ar": "src/locales/ar.ts",
      "locales/bn": "src/locales/bn.ts",
      "locales/hi": "src/locales/hi.ts",
      "locales/th": "src/locales/th.ts",
      "locales/index": "src/locales/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    outExtension: ({ format }) => ({
      js: format === "cjs" ? ".cjs" : ".js",
    }),
    treeshake: true,
  },
]);
