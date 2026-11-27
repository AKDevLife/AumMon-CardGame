# @aummon/game-engine

Pure TypeScript engine for AumMon Casual Discard Edition (`ruleset_version = "7"`, `docs/platform/PLATFORM_SPEC.md`).

## Isolation rules (enforced)

- No runtime dependencies; no React, Supabase, `node:*`, `npm:`/`jsr:` or URL imports (ESLint + `tests/architecture/engine-isolation.test.ts`).
- No DOM / Node / Deno globals (`tsconfig`: `lib: ["ES2022"]`, `types: []`).
- No `Math.random` / `Date.now` / `new Date()` — randomness comes from the injected seeded RNG.

## Layout

```text
src/
├── rng/       # seeded PRNG
├── discard/   # cards.ts (data), engine.ts (startGame/applyCommand), view.ts (per-seat view), bot.ts
├── version.ts # ENGINE_VERSION / RULESET_VERSION
└── index.ts
```

The Edge Functions use a generated copy (`node scripts/sync-engine.mjs`).
