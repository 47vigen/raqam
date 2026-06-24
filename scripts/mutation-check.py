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

import json, tempfile

def run_test(test):
    """Run one behavioral test file and read vitest's JSON result FROM A FILE
    (robust to any stdout wrapping). Returns (ran, pass_n, fail_n) where `ran` is
    True only if vitest actually executed a suite — so a missing-dep / broken
    install (file never written) is distinguished from a real assertion failure."""
    out_file = os.path.join(tempfile.gettempdir(), "raqam_mutation_result.json")
    try:
        os.remove(out_file)
    except OSError:
        pass
    subprocess.run(["pnpm", "exec", "vitest", "run", test,
                    "--reporter=json", "--outputFile=" + out_file],
                   capture_output=True, text=True, timeout=180)
    if not os.path.exists(out_file):
        return (False, 0, 0)  # vitest never ran (setup/install error) — inconclusive
    try:
        d = json.load(open(out_file))
    except Exception:
        return (False, 0, 0)
    total = d.get("numTotalTests", 0)
    suites = d.get("numTotalTestSuites", 0)
    # A failed suite (compile error from the mutation) counts as caught too.
    failed = d.get("numFailedTests", 0) + d.get("numFailedTestSuites", 0)
    ran = total > 0 or suites > 0
    return (ran, d.get("numPassedTests", 0), failed)

# Warn if a mutated file is dirty: we restore from the in-memory buffer (so local
# edits are preserved), but a green baseline must reflect the committed fix.
files = sorted({m[1] for m in MUT})
dirty = subprocess.run(["git", "status", "--porcelain"] + files,
                       capture_output=True, text=True).stdout.strip()
if dirty:
    print("WARNING: mutated source files have uncommitted changes — baseline may not reflect the fix:\n" + dirty)

# Baseline: each target test must be GREEN before mutating, else the run is
# inconclusive for it (the test/environment is broken, not the mutation).
baseline_ok = {}
for test in sorted({m[4] for m in MUT}):
    ran, _p, f = run_test(test)
    baseline_ok[test] = ran and f == 0
    if not baseline_ok[test]:
        print(f"BASELINE NOT GREEN for {test} (ran={ran}, fail={f}) — its mutations are INCONCLUSIVE")

results = []
for mid, fpath, old, new, test in MUT:
    with open(fpath) as fh:
        orig = fh.read()
    if orig.count(old) != 1:
        results.append((mid, "SKIPPED (snippet drifted from source)")); continue
    if not baseline_ok[test]:
        results.append((mid, "INCONCLUSIVE (baseline not green)")); continue
    try:
        with open(fpath, "w") as fh:
            fh.write(orig.replace(old, new, 1))
        ran, _p, f = run_test(test)
        if not ran:
            results.append((mid, "INCONCLUSIVE (runner/compile error, not an assertion)"))
        elif f > 0:
            results.append((mid, f"RED (caught by {f} assertion failure{'s' if f != 1 else ''})"))
        else:
            results.append((mid, "GREEN (GAP! the test stayed green)"))
    finally:
        with open(fpath, "w") as fh:  # restore the saved buffer (preserves any local edits)
            fh.write(orig)

print("\n=== MUTATION TESTING RESULTS ===")
caught = sum(1 for _, s in results if s.startswith("RED"))
for mid, status in results:
    tag = "OK" if status.startswith("RED") else "GAP" if status.startswith("GREEN") else "--"
    print(f"  [{tag}] {mid:28} -> {status}")
print(f"\nCaught {caught}/{len(MUT)} mutations by a REAL assertion failure "
      "(runner/setup failures are not counted as caught).")
