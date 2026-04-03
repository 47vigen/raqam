/**
 * All locale plugins — import this to register support for
 * Persian, Arabic, Bengali, Hindi, and Thai digit systems in one shot.
 *
 * Usage:
 *   import 'numra/locales'
 *
 * Named re-exports alias each LOCALE_CODES array to avoid ambiguity:
 *   FA_LOCALE_CODES, AR_LOCALE_CODES, BN_LOCALE_CODES, HI_LOCALE_CODES, TH_LOCALE_CODES
 */
// Re-exporting LOCALE_CODES also evaluates each module, triggering registerLocale().
export { LOCALE_CODES as FA_LOCALE_CODES } from "./fa.js";
export { LOCALE_CODES as AR_LOCALE_CODES } from "./ar.js";
export { LOCALE_CODES as BN_LOCALE_CODES } from "./bn.js";
export { LOCALE_CODES as HI_LOCALE_CODES } from "./hi.js";
export { LOCALE_CODES as TH_LOCALE_CODES } from "./th.js";
