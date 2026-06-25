---
"raqam": patch
---

Maintenance release — no runtime changes. `raqam` still ships with zero runtime
dependencies, and its public API and behavior are unchanged.

- Refreshed the dev toolchain (Biome 1 → 2, Vitest 3 → 4, and other dev
  dependencies), which clears all known dev-only security advisories. The only
  source edits are Biome 2 autofixes (import ordering and redundant regex
  escapes) with no behavioral impact.
- Reworked CI: removed duplicate runs, pinned Node via `.nvmrc`, added
  least-privilege permissions and concurrency cancellation, and cached
  Playwright browsers.
- Added automated dependency updates (Dependabot) and a security workflow
  (CodeQL, dependency review, scheduled `pnpm audit`).
- Added a poster image to the README.
