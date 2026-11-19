# AumMon — Development Changelog

Newest first. Significant changes only.

## 2026-11-19 — 4.2–4.8 Solo backend (local Supabase)

- **Files:** `supabase/functions/{rooms-create,matches-start,matches-view,matches-submit-action,matches-use-skill}`, `supabase/functions/_shared/{http,input,auth,db,store,receipts,flow,matches}.ts`, migration `20261119000400_match_flow.sql`, `tests/integration/flow.test.ts`, `tests/backend/solo.test.ts`
- **Tests:** 7 flow tests (bots, 30s/15s timeouts, pass & play no timeout); 7 HTTP tests against real Edge Functions: unauthenticated 401, non-member 404, forged `hp` 400, foreign card 409, idempotency replay/conflict, concurrent submits → exactly one accepted, full match without leaking deck/rng/skill state.
- **Decisions (architecture detail, within blueprint):**
  - Each command = one DB transaction that first locks the `matches` row (`SELECT … FOR UPDATE`), then loads state → single resolver, no duplicate resolve, crash = rollback (replaces explicit lease tokens).
  - Canonical engine state + RNG in `private.match_runtime` (`internal_state`, `rng_state`); public mirrors in `matches`, `match_players`, `match_events`. `private.match_cards` / `round_submissions` are not used yet (state is in `internal_state`).
  - Timeouts are evaluated lazily on every view/submit (`phase_deadline`); no scheduler needed for solo.
  - Card instance ids are random UUIDs (no type info in ids).
- **Bug found & fixed by tests:** a joined `FOR UPDATE` returned a stale runtime row under READ COMMITTED → concurrent submits double-resolved; lock is now a separate statement.
- **Local env note:** edge-runtime needs `SSL_CERT_FILE` for the sandbox proxy CA (local only, git-ignored).

## 2026-11-19 — 4.1 Engine in Edge Functions

- **Files:** `scripts/sync-engine.mjs`, `supabase/functions/{deno.json,engine-health/index.ts,_shared/deno-env.d.ts}`, `tsconfig.functions.json`, CI `e2e-auth` job boots functions
- **Tests:** local `supabase functions serve` → `engine-health` returns `{"engineVersion":"0.1.0","rulesetVersion":"1"}`; same check in CI
- **Decisions:** Supabase only mounts/bundles `supabase/`, so engine sources are copied (git-ignored, generated) to `supabase/functions/_shared/game-engine` by `pnpm sync:engine` before serve/deploy; import map `@aummon/game-engine`; Edge Functions type-checked by repo TS with minimal Deno ambient types.

## 2026-11-19 — 3.1–3.13 Pure game engine (Rulebook v1)

- **Files:** `packages/game-engine/src/{domain,rng,rules/v1,characters,bots,views}/*`, tests in `packages/game-engine/tests/*`
- **Tests:** 71 engine tests: every Rulebook v1 rule (1, 3–15) with scenarios; validator/legal actions; player-view leak checks; bot legality over 59 seeds; 75 full bot-vs-bot games (2–4 players) checking card conservation (40), HP bounds, no actions after elimination, termination, determinism.
- **Decisions:** xoshiro128** RNG with serializable state (replay/recovery); `submitAction` does not bump `version` (simultaneous Select), phase transitions do; played cards leave the hand at reveal (cannot be dodge-discarded) and go to discard after resolving (Q8); Defense/Redirect applied at reveal as round-long effects (Rule 4, Q2); `turn_start` phase in engine only (DB in 4.12); `normal` bot scores legal actions, ties broken by RNG (Q12).
- **Phase 3 acceptance:** scenarios run without browser/DB ✅ · no Supabase/UI deps (ESLint + architecture test) ✅ · spec §9 DoD test list covered ✅

## 2026-11-19 — 2.10 Auth E2E · Phase 2 complete (local)

- **Files:** `tests/e2e/auth.spec.ts`, CI job `e2e-auth` (starts local Supabase in the runner — no cloud)
- **Tests:** sign up → profile edit persists → logout → wrong password rejected → login
- **Phase 2 acceptance:** A cannot read/edit B profile ✅ · non-member cannot read match ✅ · browser cannot read `private` ✅ · migrations + seed reproducible ✅
- **Remaining:** apply migrations to Supabase Dev project after 1.10.

## 2026-11-19 — 2.9 Profile UI

- **Files:** `src/features/profile/ProfilePage.tsx` (+ tests), `/profile` route, header "โปรไฟล์" link (email moved from header to profile page for small screens)
- **Tests:** 6 new unit tests (44 total); real flow covered by 2.10 E2E
- **Decisions:** only `display_name` is editable (column grant from 2.3); avatar upload not in scope (no storage in blueprint Phase 2).

## 2026-11-19 — 2.8 Auth UI

- **Files:** `src/features/auth/{AuthProvider,AccountNav,AuthCard,LoginPage,RegisterPage,validation,auth-context}.*`, `src/app/AppLayout.tsx`, `src/main.tsx`
- **Tests:** 8 new unit tests (38 total, mocked client); manual Playwright run against local Supabase stack: register → profile created by trigger → logout → wrong password rejected → login → session persists after reload ✅
- **Decisions:** live mode only when `VITE_SUPABASE_*` is valid; otherwise preview banner + disabled forms (Vercel Preview has no env yet); generic login/signup errors (no account enumeration); display name sent as `display_name` metadata for the 2.2 trigger; password min 6 = `config.toml`.
- **Remaining:** automated auth E2E in CI → 2.10.

## 2026-11-19 — 2.7 Browser Supabase client

- **Files:** `src/lib/env.ts`, `src/lib/supabase/client.ts` (+ tests); dependency `@supabase/supabase-js`
- **Tests:** 12 new unit tests (30 total)
- **Decisions:** env result is `configured` / `missing` (UI preview mode, client = null) / `invalid`; non-local URLs must be https; `sb_secret_*` keys and `service_role` JWTs are rejected in the browser.
- **Env:** full local Supabase stack runs via `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io supabase start` (public.ecr.aws quota exceeded in this environment).

## 2026-11-19 — 2.6 Access-matrix tests

- **Files:** `supabase/tests/database/006_access_matrix.test.sql`
- **Tests:** 23 new (117 total): pass & play owner sees local seats; lobby member sees own lobby only; all 5 private tables denied to clients (incl. own hand); clients cannot forge events or change phase; anon has no SELECT on any public table; service_role bypasses RLS.
- **Phase 2 acceptance (DB part):** A cannot read/edit B profile ✅ · non-member cannot read match ✅ · browser roles cannot read `private` ✅ · migrations + seed reproducible ✅

## 2026-11-19 — 2.5 Seed data (local only)

- **Files:** `supabase/seed.sql`, `supabase/tests/database/005_seed.test.sql`, `scripts/db-test.sh` (applies seed twice to prove idempotency)
- **Tests:** 9 new pgTAP tests (94 total): 4 characters match spec §3, 40 cards = 16/10/8/6, chaos 2/2/2
- **Decisions:** card IDs `attack`, `defense`, `support`, `chaos_redirect`, `chaos_aoe`, `chaos_disrupt`; `effect_spec` is descriptive metadata only — rule logic stays in the engine; deck `standard` v1 active.

## 2026-11-19 — 2.4 RLS policies (local only)

- **Files:** `supabase/migrations/20261119000300_rls_policies.sql`, `supabase/tests/database/004_rls_policies.test.sql`
- **Tests:** 22 new pgTAP tests (85 total) — User A, User B, non-member, anonymous
- **Decisions:** helpers `is_match_member` (blueprint §4.3) and `is_room_member` (same pattern, avoids recursion) are SECURITY DEFINER, empty search_path, EXECUTE for authenticated only; profiles readable/updatable by owner only (other players' names come from `display_name_snapshot`); disabled characters/cards hidden; all policies SELECT-only except own-profile UPDATE.
- **Note:** local `supabase/postgres` image's `auth.uid()` reads legacy `request.jwt.claim.sub`; tests set both claim settings.

## 2026-11-19 — 2.3 Public grants (local only)

- **Files:** `supabase/migrations/20261119000200_public_grants.sql`, `supabase/tests/database/003_public_grants.test.sql`
- **Tests:** 13 new pgTAP tests (63 total); 001 tests updated (client writes now denied by grant, not only RLS)
- **Decisions:** revoked Supabase default ALL from anon/authenticated (tables, sequences, functions) incl. default privileges for future objects; `authenticated` gets SELECT on 10 public tables + UPDATE(display_name, avatar_url) on profiles; anon gets nothing (account required); all game writes via service_role.

## 2026-11-19 — 1.11 Vercel Preview verified

- Vercel builds a Preview deployment per PR (PR #9 status: success). No env vars; Production auto-deploy from `main` disabled.

## 2026-11-19 — 1.13–1.16 UI Preview

- **Files:** `src/app/{AppLayout,HomePage,NotFoundPage,routes}.tsx`, `src/features/auth/*`, `src/components/{PreviewBanner,TextField}.tsx`, `vercel.json`, `tests/e2e/smoke.spec.ts`
- **Tests:** 18 unit, 6 E2E (desktop + iPhone 13 viewport, no horizontal scroll)
- **Decisions:** added `react-router` (blueprint `src/app/` router); forms are disabled and every page shows a "not connected" banner — no mock auth; Vercel auto-deploy from `main` disabled per owner (Preview per PR only); `noindex` header.
- **Remaining:** owner must import repo into Vercel (1.11).

## 2026-11-19 — 2.2 Database triggers (local only)

- **Files:** `supabase/migrations/20261119000100_triggers.sql`, `supabase/tests/database/002_triggers.test.sql`
- **Tests:** 14 new pgTAP tests (49 total): profile auto-create, display-name fallback, duplicate rejection, `updated_at` override, function security
- **Decisions:** `private.handle_new_user()` is SECURITY DEFINER with `search_path = ''`, in non-exposed `private` schema, EXECUTE revoked from client roles; `on conflict do nothing`. Display name from `raw_user_meta_data.display_name` (trimmed, 2–24 chars) else `Player-<6 hex of id>`. `updated_at` trigger only on `profiles` (only table with that column).

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
