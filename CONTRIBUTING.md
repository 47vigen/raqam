# Contributing to numra

## Development setup

```bash
# Clone and install
git clone https://github.com/47vigen/numra.git
cd numra
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

Locale plugins live in `src/locales/`. Each plugin registers digit blocks via `registerLocale()`:

```ts
// src/locales/my-locale.ts
import { registerLocale } from '../core/normalizer.js'

// Register digit codepoint range [start, end] inclusive
registerLocale({ digits: [0xXXX0, 0xXXX9] })
```

Add a corresponding test verifying digit normalization round-trips.

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
