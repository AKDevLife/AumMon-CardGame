# AumMon Domain

## Authoritative documents

- `aummon_game_spec.md` — product/platform decisions + index (v2: guest-first party platform, flagship BLUFF; product docs in `docs/v2/`). EDO Battle rules live in `docs/discard/`.
- `aummon_project_blueprint.md` — architecture, database, security, stack and test plan; roadmap in `docs/DEVELOPMENT_ROADMAP.md`.
- `docs/discard/AumMon_Rule_Clarification.md` — owner decisions and open questions.

## Rules

- Platform decisions (spec §1) and each game's rules change only with owner approval; result-affecting changes require a new `ruleset_version` per game (EDO Battle: `"13"`; history in the changelog).
- Never invent missing mechanics. Never silently resolve conflicting requirements; record them in `docs/discard/AumMon_Rule_Clarification.md`, mark affected tasks blocked, and continue with unblocked work.
- Approved architecture: React + Vite + TS strict, Tailwind, Supabase (Auth, PostgreSQL, Edge Functions, Realtime), Vercel.
- `packages/game-engine` stays pure TypeScript: no React, UI, Supabase, Node/Deno/browser APIs, I/O, `Math.random` or wall-clock time (enforced by ESLint, tsconfig and architecture test — never relax these).
- Server-authoritative: clients send intent only (card instance, target, choice, idempotency key); the server computes all results. Bots run server-side and see only their seat's allowed data.
- RLS on every exposed table; the `private` schema is never exposed through the Supabase API.
