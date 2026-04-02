import { defineConfig } from "tsup";

export default defineConfig([
  // Main entries: index, core, react
  {
    entry: {
      index: "src/index.ts",
      core: "src/core/index.ts",
      react: "src/react/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    banner: { js: '"use client";' },
    outExtension: ({ format }) => ({
      js: format === "cjs" ? ".cjs" : ".js",
    }),
    treeshake: true,
    splitting: false,
    minify: true,
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
