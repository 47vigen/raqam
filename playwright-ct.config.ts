import { defineConfig, devices } from "@playwright/experimental-ct-react";

/**
 * Playwright Component Testing configuration.
 *
 * Runs React components in real browsers (Chromium, Firefox, WebKit) for
 * cursor behavior tests that jsdom cannot simulate accurately. Specifically:
 *   - selectionStart / selectionEnd after programmatic formatting
 *   - Selection range after rapid keystroke sequences
 *   - RTL text direction and caret positioning
 *
 * Usage:
 *   pnpm test:e2e            — headless, all browsers
 *   pnpm test:e2e:ui         — Playwright UI mode
 *   pnpm test:e2e:debug      — headed Chromium for debugging
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.tsx",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["list"],
  ],

  use: {
    /* Component test mount point */
    ctPort: 3100,
    ctViteConfig: {
      // Inherit from project's vite-compatible tsconfig
      resolve: {
        alias: {
          // Allow tests to import 'numra' as if installed
          numra: "./src/index.ts",
          "numra/locales/fa": "./src/locales/fa.ts",
          "numra/locales/ar": "./src/locales/ar.ts",
          "numra/locales/hi": "./src/locales/hi.ts",
          "numra/locales/bn": "./src/locales/bn.ts",
          "numra/locales/th": "./src/locales/th.ts",
        },
      },
    },
    /* Global defaults */
    actionTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
