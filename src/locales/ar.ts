/**
 * Arabic (ar) locale plugin.
 *
 * Registers Arabic-Indic digit block (U+0660–U+0669).
 *
 * Usage:
 *   import 'numra/locales/ar'
 */
import { registerLocale } from "../core/normalizer.js";

registerLocale({
  digitBlocks: [
    [0x0660, 0x0669], // Arabic-Indic ٠–٩
  ],
});

/** BCP 47 locale tags that this plugin covers. */
export const LOCALE_CODES = ["ar", "ar-EG", "ar-SA", "ar-MA", "ar-DZ", "ar-TN"] as const;
