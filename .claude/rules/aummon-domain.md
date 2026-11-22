# AumMon Domain

## Authoritative documents

- `aummon_game_spec.md` — product/platform decisions + index; rules and cards live in `docs/discard/` (Casual Discard Edition, 2–8 players).
- `aummon_project_blueprint.md` — architecture, database, security, stack and test plan; roadmap in `docs/DEVELOPMENT_ROADMAP.md`.
- `docs/discard/AumMon_Rule_Clarification.md` — owner decisions and open questions.

## Rules

- Platform decisions (spec §1), Core Rules and the Card Library change only with owner approval; result-affecting changes require a new `ruleset_version` (current: `"7"`; `"1"`–`"6"` retired with the 1v1 TCG in task 12.4).
- Never invent missing mechanics. Never silently resolve conflicting requirements; record them in `docs/discard/AumMon_Rule_Clarification.md`, mark affected tasks blocked, and continue with unblocked work.
- Approved architecture: React + Vite + TS strict, Tailwind, Supabase (Auth, PostgreSQL, Edge Functions, Realtime), Vercel.
- `packages/game-engine` stays pure TypeScript: no React, UI, Supabase, Node/Deno/browser APIs, I/O, `Math.random` or wall-clock time (enforced by ESLint, tsconfig and architecture test — never relax these).
- Server-authoritative: clients send intent only (card instance, target, choice, idempotency key); the server computes all results. Bots run server-side and see only their seat's allowed data.
- RLS on every exposed table; the `private` schema is never exposed through the Supabase API.
