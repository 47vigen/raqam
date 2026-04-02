/**
 * Persian (fa-IR) locale plugin.
 *
 * Registers Extended Arabic-Indic digit block (U+06F0–U+06F9).
 * The ISIRI 9147 keyboard produces these codepoints when number keys are
 * pressed on a Persian layout. This side-effect import enables their
 * normalization to ASCII 0–9 before parsing.
 *
 * Also registers the Arabic-Indic block for mixed-input scenarios.
 *
 * Usage:
 *   import 'numra/locales/fa'
 */
import { registerLocale } from "../core/normalizer.js";

registerLocale({
  digitBlocks: [
    [0x06f0, 0x06f9], // Extended Arabic-Indic (Persian) ۰–۹
    [0x0660, 0x0669], // Arabic-Indic ٠–٩
  ],
});
