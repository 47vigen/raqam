#!/usr/bin/env python3
"""Mutation check — revert each fix and confirm a behavioral test goes red.
See scripts/mutation-check.md. Run from anywhere inside the repo.
The source snippets below are tied to the current source; if one drifts, that
mutation is skipped with a "SNIPPET COUNT" message rather than silently passing."""
import subprocess, os
REPO = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                      capture_output=True, text=True).stdout.strip()
os.chdir(REPO)

P = "src/core/parser.ts"
S = "src/react/useNumberFieldState.ts"
F = "src/react/useNumberField.ts"
FM = "src/core/formatter.ts"

MUT = [
 ("C2-trailing-zero-wipe", P,
  "      value: n,\n      isValid: true,",
  "      value: isIntermediateStripped(stripped, allowDecimal) ? null : n,\n      isValid: true,",
  "src/react/behavior/decimals.test.tsx"),
 ("percent-div100", P,
  "    if (isPercent && n !== 0) n = Number((n / 100).toPrecision(15));\n", "",
  "src/react/behavior/percent.test.tsx"),
 ("neg-zero", P,
  "    if (Object.is(n, -0)) n = 0;\n", "",
  "src/react/behavior/negatives.test.tsx"),
 ("minus-dedup", P,
  '    if (s.includes("-")) {\n      const negative = s.startsWith("-");\n      s = s.replace(/-/g, "");\n      if (negative) s = `-${s}`;\n    }\n', "",
  "src/react/behavior/negatives.test.tsx"),
 ("C3-controlled-sync", S,
  "      setInputValueRaw(formatted);\n      setRawValueState(finite ? String(ev) : null);",
  "      /* MUT */\n      setRawValueState(finite ? String(ev) : null);",
  "src/react/behavior/controlled.test.tsx"),
 ("H4-allowOutOfRange", S,
  "      const raw = preciseAdd(base, s);\n      const next = allowOutOfRange ? raw : clamp(raw, minValue, maxValue);",
  "      const raw = preciseAdd(base, s);\n      const next = clamp(raw, minValue, maxValue);",
  "src/react/behavior/steppers.test.tsx"),
 ("step-1e-7", S,
  '  // Exponential form (e.g. "1e-7", "1.5e-7") — String() uses it below 1e-6.\n  const eIdx = s.indexOf("e");\n  if (eIdx !== -1) {\n    const exp = Number(s.slice(eIdx + 1));\n    const dotIdx = s.indexOf(".");\n    const fracLen = dotIdx === -1 ? 0 : eIdx - dotIdx - 1;\n    return Math.max(0, fracLen - exp);\n  }\n', "",
  "src/react/behavior/steppers.test.tsx"),
 ("A-currency-live-grouping", F,
  "displayValue = liveFormatter.format(result.value);",
  "displayValue = formatter.format(result.value);",
  "src/react/behavior/currency.test.tsx"),
 ("J-ascii-dot-i18n", F,
  '      } else if (info.decimalSeparator !== "." && info.groupingSeparator !== ".") {',
  "      } else if (false) {",
  "src/react/behavior/i18n.test.tsx"),
 ("BC-locale-probe-neutral", FM,
  "  const probeFmt = getFormatter(locale, {\n    minimumFractionDigits: 1,\n    maximumFractionDigits: 1,\n    numberingSystem: options?.numberingSystem,\n  });",
  "  const probeFmt = styledFmt;",
  "src/react/behavior/percent.test.tsx"),
 ("N3-leading-dot-guard", F,
  "      if (!/\\d/.test(normalizeDigits(source.slice(0, decIdx)))) return null; // leading dot",
  "      // MUT leading-dot guard removed",
  "src/react/behavior/decimals.test.tsx"),
 ("M-native-affordance-bksp", F,
  "ch !== undefined && /\\p{Nd}/u.test(ch);",
  'ch !== undefined && ch >= "0" && ch <= "9";',
  "src/react/behavior/editing.test.tsx"),
]

results = []
for mid, fpath, old, new, test in MUT:
    with open(fpath) as fh: orig = fh.read()
    cnt = orig.count(old)
    if cnt != 1:
        results.append((mid, f"SNIPPET COUNT={cnt} (expected 1) — skipped", None)); continue
    try:
        with open(fpath, "w") as fh: fh.write(orig.replace(old, new, 1))
        r = subprocess.run(["pnpm","exec","vitest","run",test,"--reporter=basic"],
                           capture_output=True, text=True, timeout=120)
        out = r.stdout + r.stderr
        red = r.returncode != 0
        # extract a failing test name if present
        fail_lines = [l.strip() for l in out.splitlines() if "FAIL" in l or "×" in l]
        results.append((mid, "RED (caught)" if red else "GREEN (GAP!)", fail_lines[:2]))
    finally:
        subprocess.run(["git","checkout","--",fpath], check=False)

print("\n=== MUTATION TESTING RESULTS ===")
caught = 0
for mid, status, fails in results:
    print(f"  [{ 'OK' if 'RED' in status else 'GAP' if 'GREEN' in status else '??' }] {mid:28} -> {status}")
    if "RED" in status: caught += 1
print(f"\nCaught {caught}/{len(MUT)} mutations (red = the new test detected the re-introduced bug)")
# verify clean restore
g = subprocess.run(["git","status","--porcelain"], capture_output=True, text=True)
src_dirty = [l for l in g.stdout.splitlines() if any(x in l for x in ["src/core/parser","src/core/formatter","useNumberField"])]
print("Source files restored cleanly:" , "YES" if not src_dirty else f"NO -> {src_dirty}")
