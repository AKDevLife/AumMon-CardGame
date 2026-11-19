# AumMon — Development Changelog

Newest first. Significant changes only.

## 2026-11-19 — 2.1 Core schema migration (local only)

- **Files:** `supabase/migrations/20261119000000_core_schema.sql`, `supabase/tests/database/001_core_schema.test.sql`, `scripts/db-test.sh`, `tests/architecture/supabase-config.test.ts`, CI `database` job
- **Tests:** migration on local `supabase/postgres:17`; 35 pgTAP tests (tables, RLS on, private schema denied to anon/authenticated, constraints, composite FKs, client cannot read/write game state)
- **Decisions / deviations from blueprint §3.4:** `deck_templates` PK `(id, version)` + one active version per id; unique character per room/match (Q10); human/bot/local check on `match_players`; explicit `service_role` grants on `private`; dropped duplicate `match_events` index (covered by unique constraint).
- **Deferred:** `matches.phase = 'turn_start'` (Q7) not added — blueprint enum kept; will add in a new migration with task 4.12. RLS policies → 2.4, triggers → 2.2, seed → 2.5.
- **Remaining:** no cloud project linked (1.10).

## 2026-11-19 — Provisional rule decisions (Q6, Q8–Q12)

- **Files:** `docs/rule-clarifications.md`
- **Decisions (owner-delegated):** heal at full HP legal/no effect; played, cancelled and eliminated-hand cards go to discard; no self-targeting; unique characters per match; no timeout in Pass & Play; single `normal` bot in v1.
- **Remaining:** none — all 12 questions have provisional answers.

## 2026-11-19 — Provisional rule decisions (Q1–Q5, Q7)

- **Files:** `docs/rule-clarifications.md`, `docs/DEVELOPMENT_ROADMAP.md`
- **Decisions (owner-delegated, revisit after playtest):** chaos 2/2/2; Redirect = round-long, single-target actions only; no speed-swap chaos in v1; Pyro bonus added after reductions, `attack` only; AoE = one Hit per target; Aqua = opt-in `turn_start` window (15s, auto-skip).
- **Effect:** tasks 3.7, 3.8 unblocked; new task 4.12 (Aqua skill command). Rulebook v1 text unchanged.
- **Remaining:** Q6, Q8–Q12 open.

## 2026-11-19 — 1.9 Autonomy rules + progress tracking

- **Files:** `CLAUDE.md`, `.claude/rules/*` (new `progress-tracking.md`), `docs/DEVELOPMENT_*.md`, `scripts/progress.mjs`
- **Tests:** `pnpm check`, `pnpm progress`
- **Decisions:** Claude may self-merge PRs when merge conditions pass; percentages computed from roadmap checkboxes, not estimated.
- **Remaining:** 1.10–1.12 blocked on owner.

## 2026-11-19 — 1.9 Claude operating rules (PR #2)

- **Files:** `CLAUDE.md`, `.claude/rules/*`
- **Tests:** format check, secret scan; CI ✅

## 2026-11-19 — 1.1–1.8 Phase 1 foundation (PR #1)

- **Files:** root configs (pnpm, tsconfig, ESLint, Prettier, Vite, Vitest, Playwright), `src/`, `packages/game-engine/`, `supabase/config.toml`, `.github/workflows/ci.yml`, `scripts/check-secrets.mjs`, `docs/rule-clarifications.md`
- **Tests:** typecheck, lint, 11 unit/architecture tests, build, secret scan, Playwright smoke; CI ✅
- **Decisions:** pnpm workspaces; TypeScript 6.0 (typescript-eslint does not support 7.x yet); engine source-only package with `.ts` import extensions for Deno compatibility; engine isolation enforced by ESLint + tsconfig + architecture test.
- **Remaining:** Supabase/Vercel setup and branch protection need owner accounts; 12 rule clarifications open.
