# @aummon/game-engine

Pure TypeScript game engine for AumMon — ruleset 2 (1v1 TCG, `aummon_game_spec.md` v3.0).

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
├── rng/          # seeded PRNG (injected randomness)
├── rules/v2/     # ruleset 2: cards, recipes, match flow, combat, bot, views
├── version.ts    # ENGINE_VERSION / RULESET_VERSION
└── index.ts      # public API (`v2` namespace)
tests/            # Vitest unit / scenario / simulation tests
```

Relative imports use explicit `.ts` extensions so the same source runs in
Vite, Vitest, Node.js and Deno (Supabase Edge Functions).
