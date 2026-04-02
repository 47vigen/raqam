/**
 * Thai (th-TH) locale plugin.
 *
 * Registers Thai digit block (U+0E50–U+0E59).
 *
 * Usage:
 *   import 'numra/locales/th'
 */
import { registerLocale } from "../core/normalizer.js";

registerLocale({
  digitBlocks: [
    [0x0e50, 0x0e59], // Thai ๐–๙
  ],
});
