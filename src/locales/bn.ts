/**
 * Bengali (bn-BD / bn-IN) locale plugin.
 *
 * Registers Bengali digit block (U+09E6–U+09EF).
 *
 * Usage:
 *   import 'numra/locales/bn'
 */
import { registerLocale } from "../core/normalizer.js";

registerLocale({
  digitBlocks: [
    [0x09e6, 0x09ef], // Bengali ০–৯
  ],
});

/** BCP 47 locale tags that this plugin covers. */
export const LOCALE_CODES = ["bn", "bn-BD", "bn-IN"] as const;
