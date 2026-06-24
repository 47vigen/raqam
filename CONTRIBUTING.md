# Contributing to raqam

## Development setup

```bash
# Clone and install
git clone https://github.com/47vigen/raqam.git
cd raqam
pnpm install

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build

# Storybook
pnpm storybook

# TypeCheck
pnpm typecheck
```

## Project structure

```
src/
├── core/           # Framework-agnostic engine (zero deps)
│   ├── formatter.ts    # Intl.NumberFormat wrapper
│   ├── parser.ts       # Locale-aware number parser
│   ├── cursor.ts       # Cursor position preservation algorithm
│   ├── normalizer.ts   # Unicode digit normalization
│   ├── presets.ts      # Named format configurations
│   └── types.ts        # All shared TypeScript types
├── react/          # React hooks and headless components
│   ├── useNumberFieldState.ts   # State management
│   ├── useNumberField.ts        # Behavior + ARIA hook
│   ├── useNumberFieldFormat.ts  # Display-only formatting hook
│   ├── NumberField.tsx          # Compound components
│   └── ...
├── locales/        # Locale plugins (tree-shakeable)
└── stories/        # Storybook stories
```

For the **design rationale** behind this architecture — why input is always
`type="text"`, how the cursor-preservation algorithm works, the i18n/RTL
strategy, and the full set of ADRs — see [`DEFINITION.md`](DEFINITION.md) (the
original design spec). For the user-facing API, see [`README.md`](README.md) and
the [docs site](https://47vigen.github.io/raqam/).

## Testing

All code must have tests. Run:

```bash
pnpm test            # run all tests once
pnpm test:watch      # watch mode
pnpm test:coverage   # with coverage report
```

- **Core tests**: Unit tests for pure functions — no DOM, no React
- **Hook/component tests**: React Testing Library + jsdom
- **Accessibility**: `jest-axe` assertions in component tests

## Adding a locale plugin

Locale plugins live in `src/locales/`. Each plugin is a side-effecting module
that registers one or more digit blocks via `registerLocale()` and exports the
BCP 47 tags it covers:

```ts
// src/locales/my-locale.ts
import { registerLocale } from '../core/normalizer.js'

// digitBlocks is an array of [start, end] codepoint ranges (inclusive)
registerLocale({ digitBlocks: [[0xXXX0, 0xXXX9]] })

/** BCP 47 locale tags this plugin covers. */
export const LOCALE_CODES = ['xx', 'xx-YY'] as const
```

Then re-export it from `src/locales/index.ts` (aliasing the codes) so
`import 'raqam/locales'` registers everything:

```ts
export { LOCALE_CODES as XX_LOCALE_CODES } from './my-locale.js'
```

Add a corresponding test verifying digit normalization round-trips, and a
`tsup` entry in `tsup.config.ts` if the plugin should ship as its own subpath
(`raqam/locales/xx`).

## Commit style

```
feat: add compact notation preset
fix: accounting format parser handles nested currency symbols
test: add IME composition tests for ko-KR locale
docs: document useNumberFieldFormat hook
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `perf`

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets). Before opening a PR for a user-facing change:

```bash
npx changeset
# Follow prompts to describe the change (patch/minor/major)
```

## Pull request process

1. Fork the repo, create a branch (`feat/my-feature` or `fix/the-bug`)
2. Write the code + tests
3. Run `pnpm typecheck && pnpm test && pnpm build`
4. Add a changeset (`npx changeset`) for any user-facing changes
5. Open a PR with a clear description of what and why

## Code guidelines

- **TypeScript strict mode**: All code must pass `tsc --noEmit` with zero errors
- **No new dependencies**: The core must remain zero-dep; React is a peer dep only
- **Bundle size**: Check `pnpm size` — the core must stay under 2 KB gzipped
- **Accessibility**: All interactive components must have correct ARIA attributes
- **i18n**: Never hardcode locale-specific strings — always use `Intl.NumberFormat`
