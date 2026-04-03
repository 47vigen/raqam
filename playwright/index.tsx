/**
 * Playwright CT entry point.
 *
 * Imported by every component test via the `ctPort` server.
 * Register all locale plugins here so digit normalization is available in
 * every browser-based component test.
 */
import { beforeMount, afterMount } from "@playwright/experimental-ct-react/hooks";

// Register all digit normalization plugins
import "../src/locales/fa";
import "../src/locales/ar";
import "../src/locales/hi";
import "../src/locales/bn";
import "../src/locales/th";

// Optional: apply base CSS reset so components render predictably
beforeMount(async ({ App }) => {
  // nothing special — just render the component
});

afterMount(async () => {
  // nothing to clean up
});
