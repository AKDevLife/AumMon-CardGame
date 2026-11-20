# AumMon — Development Changelog

Newest first. Significant changes only.

## 2026-11-20 — Handoff conflict recorded

- **Files:** `docs/rule-clarifications.md` (C1), `docs/DEVELOPMENT_PROGRESS.md`
- **Decision:** none — Master Handoff (1v1 TCG) conflicts with locked Rulebook v1; awaiting owner.

## 2026-11-20 — Status: paused before production

- Owner paused production work (6.8, 7.3, 7.8 deferred). Next: game/UI adjustments after playtesting.
- Progress 69/72 (96%); all non-production tasks verified.

## 2026-11-20 — 1.12 Branch protection (accepted limitation)

- Owner configured a rule for `main` (4 required CI checks; "Require approvals" removed so self-merge stays possible).
- GitHub does not enforce branch protection on private repositories on the Free plan (verified: PR #35 merged with checks pending). Owner chose option A: keep the rule ready, rely on the documented merge conditions (all CI checks green before merge). Upgrade to GitHub Pro to enforce.

## 2026-11-20 — 7.7 Smoke tests + runbook

- **Files:** `scripts/smoke.mjs` (`pnpm smoke <site> <supabase>`; read-only), `docs/OPERATIONS.md` (deploy, rollback, incident checklist)
- **Tests:** smoke on playtest + AumMon-Dev: 8/8 PASS (site 200, security headers, bundle config/no secret, deep link, engine-health, 401, CORS, private schema hidden).

## 2026-11-20 — 7.6 Load test + region fix

- **Files:** `tests/load/solo-load.mjs`, `src/lib/api.ts` (`x-region` header), `_shared/http.ts` (CORS allows `x-region`), `docs/OPERATIONS.md` (baseline)
- **Result:** 20 concurrent players on AumMon-Dev, 20/20 matches finished, 0 errors. Server p50/p95: submit 261/673 ms, rooms-create 408/926 ms, matches-start 1740/2936 ms.
- **Bug found:** Edge Functions ran near the caller (US) while the DB is in Tokyo → submit p50 ≈ 12 s. Fixed by pinning functions to the DB region via `x-region` (≈ 46× faster).
- **Scaling note:** no need for a dedicated game server at this load; `matches-start` is the slowest step (sequential inserts) — candidate for batching later.

## 2026-11-20 — 7.5 Accessibility + responsive

- **Files:** `tests/e2e/a11y.spec.ts` (axe WCAG 2.1 AA), colour fixes in `StickerButton`, `HomePage`, `AppLayout`, `MatchPage`, alerts across features
- **Tests:** axe: 5 public pages + signed-in profile, Pass & Play setup, Online, match screen — 0 violations; iPhone 13 responsive checks unchanged; full E2E 16/16.
- **Decisions:** palette unchanged (spec §5); fixed contrast by using ink text on green/pink, large bold white text on danger buttons, and ink text with a danger border for error messages.

## 2026-11-20 — 7.4 Privacy/Terms drafts + account deletion

- **Files:** migration `20261120000100_account_deletion.sql` (FKs → set null/cascade, anonymize trigger), function `account-delete`, `src/features/legal/LegalPages.tsx` (`/privacy`, `/terms`, marked DRAFT), `src/features/profile/DeleteAccount.tsx`, pgTAP 009, `tests/backend/account.test.ts`
- **Tests:** pgTAP 6 new (history kept + anonymized, profile removed); backend: confirmation required, active match forfeited, login blocked afterwards; applied to AumMon-Dev.
- **Decisions:** a human seat with `user_id = null` now means "deleted account" (constraint relaxed for humans only; bots/local still cannot have a user id); Pass & Play matches hosted by the deleted user are abandoned. Legal texts are drafts pending professional review (owner choice).

## 2026-11-20 — 7.2 Monitoring (no-cost)

- **Files:** migration `20261120000000_metrics.sql` (`private.function_metrics`, `metrics_functions_24h`, `metrics_matches_daily`), `_shared/metrics.ts`, `_shared/http.ts` (records status/latency per request), `docs/OPERATIONS.md`, pgTAP 008
- **Tests:** pgTAP 4 new (server-only, aggregates, p50); applied to AumMon-Dev and verified rows recorded after real requests.
- **Decision:** owner chose Supabase built-in logs + own metrics (no Sentry).
- **7.3** marked blocked: backup/restore test needs a separate project / paid plan.

## 2026-11-20 — 7.1 Security review

- **Files:** `docs/SECURITY_REVIEW.md`, `vercel.json` (CSP, HSTS, Permissions-Policy), `_shared/matches.ts` (match read rate limit 240/min)
- **Tests:** `pnpm audit` clean; full check suite; headers + CSP verified on the deployed preview (no CSP violations during a full solo match).
- **Open before production:** email confirmation ON + SMTP, Vercel protection decision (see review).

## 2026-11-20 — Stable playtest URL

- Branch `playtest` mirrors `main` (fast-forward by `.github/workflows/sync-playtest.yml`); Vercel Preview URL: https://aum-mon-card-game-git-playtest-aum-mon.vercel.app
- Root cause of the earlier "UI Preview" banner: the old preview was built before Vercel had the env vars; build log now prints `[aummon] VITE_SUPABASE_*: set/MISSING`.
- Verified on cloud: sign up → Solo vs 1 bot → match finished (iPhone viewport).

## 2026-11-20 — Dev playtest setup

- Owner set Vercel Preview env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Owner approved: email confirmation **off on AumMon-Dev only** (`mailer_autoconfirm = true`) for playtesting. Must stay ON for production (tracked in 7.1).

## 2026-11-20 — 1.10 Supabase Dev project (AumMon-Dev)

- **Cloud:** project `AumMon-Dev` (ref `yaxtzdhryctfjaspxvix`, ap-northeast-1) — verified by name as Dev; 7 migrations + seed applied via Management API with migration history; 11 Edge Functions deployed; secret `ALLOWED_ORIGINS`; Auth redirect allow-list for Vercel previews + localhost.
- **Files:** `supabase/config.toml` (per-function `verify_jwt = false`, import map), `supabase/functions/_shared/origins.ts` (+ tests), `RegisterPage` `emailRedirectTo`, README Dev section.
- **Verification (cloud):** 16 tables, RLS on all public tables, `private` not exposed (`db_schema = public,graphql_public`), 11 policies + realtime policy, 40-card deck; `engine-health` OK; no token → 401; CORS allows `*-aum-mon.vercel.app`, rejects others.
- **Notes:** Supabase CLI labels the project's main branch "production" — it is still the Dev project. Email confirmation is ON (Supabase default mailer only delivers to team members, ~2 emails/hour).

## 2026-11-19 — Phase 6 Online Multiplayer (local Supabase)

- **Files:** migrations `20261119000500_online.sql`, `20261119000600_realtime_private_channels.sql`; functions `rooms-join`, `rooms-ready`, `rooms-leave`, `matches-resume`, `matches-forfeit`, online mode in `rooms-create`/`matches-start`; `_shared/{lobby,ratelimit}.ts`; engine `forfeit`; UI `src/features/online/{OnlinePage,LobbyPage}.tsx`, Realtime + Presence + forfeit in `MatchPage`; tests `tests/backend/online.test.ts`, `tests/e2e/online.spec.ts`, `supabase/tests/database/007_online.test.sql`
- **Tests:** 8 backend (hashed code, bad code/character/full room, rate limit 429, ready/owner-only start, own-hand-only, RLS-filtered Realtime to members only, simultaneous submits, private channel members-only, forfeit); 4 pgTAP; 2 engine forfeit; E2E two browser contexts play a full online match.
- **Decisions:** join code = 8 chars from a 32-symbol alphabet (~1.1e12), SHA-256 only in DB, 30 min expiry, 10 joins/min per user; notifications via Postgres Changes on public mirror tables (RLS decides receivers) — no private data published; Presence on private `match:<id>` channel (realtime.messages policy using `is_match_member`); timeouts stay lazy (client refreshes at deadline); rate limits run outside the command transaction.
- **Bugs found by tests:** rate-limit increments were rolled back with failed requests; rate limiting inside the transaction could exhaust the 2-connection pool.
- **Phase 6 acceptance:** 2–4 accounts on different browsers ✅ · cannot read opponent hand/submission ✅ · duplicate/concurrent commands never double-resolve ✅
- **Remaining:** 6.8 staging project (owner, cost).

## 2026-11-19 — 4.10 + Phase 5 Pass & Play

- **Files:** `supabase/functions/_shared/{flow,matches}.ts` (`currentSeat`, `actorFor`, reveal option), `rooms-create` (pass_play seats), `matches-view` (`reveal`), `src/features/passplay/*`, `tests/backend/pass-play.test.ts`, `tests/e2e/pass-play.spec.ts`, recovery test in `tests/integration/flow.test.ts`
- **Tests:** 5 backend (seat validation, no hand before reveal, reveal shows only current seat, other accounts 404, full game); E2E 2 local seats with handoff to the end; recovery determinism (attack 10).
- **Decisions:** server picks the acting seat (lowest-seat pending player; Aqua window → Aqua) — client never sends a seat id; hands are returned only with `reveal: true` and only for the current seat; no polling in Pass & Play; no timeout (Q11).
- **Bugs found by tests:** Thai names with combining marks (e.g. "ผู้") were rejected → name regex now allows `\p{M}`; flaky backend test when a submit ended the match.
- **Phase 5 acceptance:** 2–4 players finish on one device ✅ · previous seat's hand not shown ✅ · shared-device limitation explained ✅

## 2026-11-19 — 4.9 / 4.11 / 4.12 Solo UI

- **Files:** `src/features/solo/SoloSetupPage.tsx`, `src/features/game/{MatchPage,labels,types}.ts(x)`, `src/lib/api.ts`, routes `/play/solo`, `/match/:matchId`, `tests/e2e/solo.spec.ts`
- **Tests:** 3 unit (event text); E2E: sign up → Solo vs 1 bot → play every round via UI until win/draw ✅ (local Supabase + Edge Functions); iPhone 13 screenshots reviewed.
- **Decisions:** client polls `matches-view` every 2 s (Realtime arrives in Phase 6); UI only sends card instance / target / choice / idempotency key, retries reuse the key; countdown shows server deadline; `viewerPlayerId` added to API responses.
- **Phase 4 acceptance:** 1 player + bots play to the end ✅ · bots server-side, legal only ✅ · client cannot fake HP/damage/target ✅

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
- **Decisions:** xoshiro128\*\* RNG with serializable state (replay/recovery); `submitAction` does not bump `version` (simultaneous Select), phase transitions do; played cards leave the hand at reveal (cannot be dodge-discarded) and go to discard after resolving (Q8); Defense/Redirect applied at reveal as round-long effects (Rule 4, Q2); `turn_start` phase in engine only (DB in 4.12); `normal` bot scores legal actions, ties broken by RNG (Q12).
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
