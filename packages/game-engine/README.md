# @aummon/game-engine

Pure TypeScript game engine for AumMon (Rulebook v1).

## Isolation rules (enforced)

| Rule                                                                | Enforced by                                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| No runtime dependencies                                             | `tests/architecture/engine-isolation.test.ts`                                     |
| No imports of React, Supabase, `node:*`, `npm:`/`jsr:` or HTTP URLs | ESLint `no-restricted-imports` + architecture test                                |
| No relative imports that escape this package                        | architecture test                                                                 |
| No DOM / Node.js / Deno globals                                     | `tsconfig.json` (`lib: ["ES2022"]`, `types: []`) + ESLint `no-restricted-globals` |
| No `Math.random` / `Date.now` / `new Date()` (determinism)          | ESLint                                                                            |

## Layout

```text
src/
├── domain/      # types and state models (blueprint 5.2)
├── rules/v1/    # Rulebook v1 implementation (Phase 3)
├── cards/       # card effect registry (Phase 3)
├── characters/  # character definitions + effectKey handlers (Phase 3)
├── hooks/       # five hook dispatchers (Phase 3)
├── resolver/    # round resolution pipeline (Phase 3)
├── bots/        # bot strategy interfaces (Phase 3/4)
├── views/       # client-safe player view (blueprint 5.3)
├── version.ts   # ENGINE_VERSION / RULESET_VERSION
└── index.ts     # public API
tests/           # Vitest unit / scenario tests
```

Relative imports use explicit `.ts` extensions so the same source runs in
Vite, Vitest, Node.js and Deno (Supabase Edge Functions).

The `GameEngine` interface (blueprint 5.4) and bot contracts (5.6) depend on
types not yet specified (`InitializeMatchInput`, `LegalAction`,
`ValidationResult`, `SubmittedAction`); they will be added in Phase 3.
