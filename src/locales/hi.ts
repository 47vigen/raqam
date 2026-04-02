/**
 * Hindi / Devanagari (hi-IN) locale plugin.
 *
 * Registers Devanagari digit block (U+0966–U+096F).
 *
 * Usage:
 *   import 'numra/locales/hi'
 */
import { registerLocale } from "../core/normalizer.js";

registerLocale({
  digitBlocks: [
    [0x0966, 0x096f], // Devanagari ०–९
  ],
});
