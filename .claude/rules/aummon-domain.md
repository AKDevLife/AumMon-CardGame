# AumMon Domain

## Authoritative documents

- `aummon_game_spec.md` — the single spec: game rules, abilities, cards, product/platform decisions (v7.0, Everyday Objects Battle, 1v1 TCG).
- `aummon_project_blueprint.md` — architecture, database, security, stack and roadmap (§9).
- `docs/rule-clarifications.md` — open questions only; not rules.

## Rules

- Spec sections marked LOCKED (§3), Core Rules (§4), keywords and ability rules (§5), cards (§6) and platform decisions (§1) change only with owner approval; result-affecting changes require a new `ruleset_version` (current: `"6"`; `"1"`–`"5"` retired; ruleset 5 → 6 in task 11.7).
- Never invent missing mechanics. Never silently resolve conflicting requirements; record them in `docs/rule-clarifications.md`, mark affected tasks blocked, and continue with unblocked work.
- Approved architecture: React + Vite + TS strict, Tailwind, Supabase (Auth, PostgreSQL, Edge Functions, Realtime), Vercel.
- `packages/game-engine` stays pure TypeScript: no React, UI, Supabase, Node/Deno/browser APIs, I/O, `Math.random` or wall-clock time (enforced by ESLint, tsconfig and architecture test — never relax these).
- Server-authoritative: clients send intent only (card instance, target, choice, idempotency key); the server computes all results. Bots run server-side and see only their seat's allowed data.
- RLS on every exposed table; the `private` schema is never exposed through the Supabase API.
