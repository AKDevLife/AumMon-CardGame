# AumMon Domain

## Authoritative documents

- `aummon_game_spec.md` — game rules and product requirements (authoritative for rules).
- `aummon_project_blueprint.md` — architecture, database, security, stack, roadmap.
- `docs/rule-clarifications.md` — open questions only; not rules.

## Rules

- Rulebook v1 (spec §7, 15 rules, `ruleset_version = "1"`) is locked: never change it without explicit approval. Result-affecting changes require a new `ruleset_version`.
- Never invent missing mechanics. Never silently resolve conflicting requirements; report conflicts before implementing.
- Follow the roadmap (blueprint §9); do not start a new phase without approval.
- `packages/game-engine` stays pure TypeScript: no React, UI, Supabase, Node/Deno/browser APIs, I/O, `Math.random` or wall-clock time (enforced by ESLint, tsconfig and architecture test — never relax these).
- Server-authoritative: clients send intent only (card instance, target, choice, idempotency key); the server computes all results. Bots run server-side and see only their seat's allowed data.
- The `private` schema is never exposed through the Supabase API.
