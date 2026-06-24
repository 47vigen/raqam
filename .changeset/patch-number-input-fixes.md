---
"raqam": patch
---

fix: resolve number-input typing, formatting, i18n and editing bugs

End-to-end audit of the live-typing experience across the parser, formatter,
cursor engine and React hooks. Highlights:

- decimals are no longer swallowed once grouping appears (>= 1000), and
  trailing-zero / trailing-dot decimals are no longer wiped on blur
- controlled `value` prop changes now update the display (react-hook-form)
- currency keeps live grouping while typing; min-fraction padding is applied
  only on commit; percent typing precision fixed (12.55 -> 12.55%/0.1255)
- locale-probe rewrite: U+2212 minus and decimal separators detected for every
  style; ASCII "." works as the decimal point in fa/ar locales
- compact/scientific/engineering notation typing & paste keep magnitude;
  `-0` normalized everywhere and `NaN` no longer crashes controlled inputs

Adds a regression suite (src/react/bugfixes.test.tsx).
