# AumMon — Platform Roadmap (shared website & functions)

Spec: `docs/platform/PLATFORM_SPEC.md`. Game roadmaps: `docs/games/bluff/ROADMAP.md`, `docs/games/object-battle/ROADMAP.md`.
Format: `- [ ] **P.N** task — deps: … — PR #n (date)` · `[ ]` not started · `[~]` in progress · `[x]` completed (verified) · `[!]` blocked (reason inline). Percentages: `pnpm progress` (all roadmaps, top-level tasks only).

## Phase 1 — Project Foundation

- [x] **1.1** pnpm monorepo + TypeScript strict project references — PR #1 (2026-11-19)
- [x] **1.2** React + Vite + Tailwind app shell with UI tokens (spec §5) — deps: 1.1 — PR #1 (2026-11-19)
- [x] **1.3** ESLint (incl. game-engine isolation rules) + Prettier — deps: 1.1 — PR #1 (2026-11-19)
- [x] **1.4** Vitest (engine/architecture/web) + Playwright smoke test — deps: 1.2 — PR #1 (2026-11-19)
- [x] **1.5** `packages/game-engine` skeleton + architecture isolation test — deps: 1.3 — PR #1 (2026-11-19)
- [x] **1.6** Supabase CLI local config (`supabase init`, `private` not exposed) — deps: 1.1 — PR #1 (2026-11-19)
- [x] **1.7** GitHub Actions CI: typecheck, lint, format, test, build, secret scan, E2E — deps: 1.4 — PR #1 (2026-11-19)
- [x] **1.8** Secret guard script, README, `.env.example` — deps: 1.7 — PR #1 (2026-11-19)
- [x] **1.9** Claude operating rules + progress tracking system — PR #2, #3 (2026-11-19)
- [x] **1.10** Supabase Dev project `AumMon-Dev` linked: 7 migrations + seed applied, 11 Edge Functions deployed, CORS/Auth redirects set — PR #25 (2026-11-20)
- [x] **1.11** Vercel Preview per PR (verified PR #9); Production auto-deploy disabled via `vercel.json` — PR #9 (2026-11-19)
- [x] **1.12** Branch protection on `main` — rule configured (4 required checks, no required approvals) but **not enforced on a private repo on the Free plan**; accepted by owner (option A): Claude merges only after all CI checks pass — PR #37 (2026-11-20)

### UI Preview track (parallel; no backend, engine or DB work)

- [x] **1.13** Main layout + router (iPhone safe areas, `100dvh`, touch targets) — deps: 1.2 — PR #8 (2026-11-19)
- [x] **1.14** Home, Login, Register UI only — forms disabled, "UI Preview — ยังไม่เชื่อมระบบจริง" banner on every page (real auth: 2.8–2.9) — deps: 1.13 — PR #8 (2026-11-19)
- [x] **1.15** `vercel.json`: SPA rewrites, security headers, `noindex`, auto-deploy from `main` disabled (no Production) — deps: 1.14 — PR #8 (2026-11-19)
- [x] **1.16** Responsive E2E: iPhone 13 viewport, no horizontal scroll, screenshots — deps: 1.14 — PR #8 (2026-11-19)

**UI Preview acceptance:** PR Preview URL opens on iPhone; no Production deployment; no secrets in bundle.

**Acceptance (blueprint §9 Phase 1):** PRs pass CI ✅ · Deploy Preview works (1.11) · no secrets in client bundle or Git ✅

## Phase 2 — Auth & Database Foundation

- [x] **2.1** Migration: `public`/`private` schemas, core tables, composite FKs, indexes (blueprint §3.4) — deps: 1.6 — PR #6 (2026-11-19)
  - [x] `deck_templates` PK `(id, version)`; composite FKs from `deck_template_cards`, `matches`
  - [x] RLS enabled on all `public` tables (deny-all until 2.4); `private` revoked from anon/authenticated, granted to service_role
  - [x] pgTAP tests + `pnpm db:test` + CI `database` job
- [x] **2.2** `profiles` auto-create trigger + `updated_at` triggers — deps: 2.1 — PR #7 (2026-11-19)
- [x] **2.3** Grants review for `public` tables (least privilege for anon/authenticated); `private` grants done in 2.1 — deps: 2.1 — PR #10 (2026-11-19)
- [x] **2.4** RLS policies for all `public` tables + `is_match_member` helper — deps: 2.3 — PR #12 (2026-11-19)
- [x] **2.5** Seed: 4 characters, card definitions, deck template v1 (16/10/8/6) — deps: 2.1 — PR #13 (2026-11-19)
  - [x] Chaos split 2/2/2 + card IDs per clarification Q1 (provisional)
- [x] **2.6** SQL/RLS tests: User A, User B, anonymous, non-member — deps: 2.4 — PR #14 (2026-11-19)
- [x] **2.7** Browser Supabase client + env validation — deps: 2.1 — PR #15 (2026-11-19)
- [x] **2.8** Sign up / Login / Logout / session handling UI — deps: 2.7 — PR #16 (2026-11-19)
- [x] **2.9** Profile create/update UI (display name validation) — deps: 2.8 — PR #17 (2026-11-19)
- [x] **2.10** E2E: sign up → login → profile — deps: 2.9 — PR #18 (2026-11-19)

**Acceptance:** A cannot read/edit B's private profile · non-member cannot read a match · browser cannot read `private` schema · migrations + seed reproducible

## Phase 6 — Online Multiplayer

- [x] **6.1** Create/join lobby; join code random, hashed, expiring, rate-limited — deps: 4.2 — PR #24 (2026-11-19)
- [x] **6.2** Ready / start / leave (`rooms-ready`, `rooms-leave`) — deps: 6.1 — PR #24 (2026-11-19)
- [x] **6.3** Private Realtime channels + authorization; Presence online/offline — deps: 6.1 — PR #24 (2026-11-19)
- [x] **6.4** Reconnect / resume (`matches-resume`) + forfeit (`matches-forfeit`) — deps: 6.3 — PR #24 (2026-11-19)
- [x] **6.5** Disconnect/timeout 30s → server bot, regain control next round (Rule 14) — deps: 4.4, 6.4 — PR #24 (2026-11-19)
- [x] **6.6** Concurrency tests: duplicate/simultaneous submits, single resolver — deps: 6.5 — PR #24 (2026-11-19)
- [x] **6.7** E2E: two-browser online match — deps: 6.5 — PR #24 (2026-11-19)
- [!] **6.8** Staging Supabase project separate from production — Deferred by owner (2026-11-20) until production launch — owner account, may exceed free tier

**Acceptance:** 2–4 accounts on different devices · cannot read opponent hand/submission · duplicate/concurrent commands never double-resolve

## Phase 7 — Public Launch & Scale Evaluation

- [x] **7.1** Security review + abuse checks (rate limits, CORS, CSP, headers; re-enable email confirmation for production) — deps: 6.7 — PR #29 (2026-11-20)
- [x] **7.2** Error tracking / monitoring + scaling metrics (blueprint §11.4) — deps: 6.7 — Supabase logs + `private.metrics_*` views (owner choice 1A) — PR #30 (2026-11-20)
- [!] **7.3** Backup + restore test — deps: 6.8 — Deferred by owner (2026-11-20) — needs 6.8; Free plan has no restorable backups
- [x] **7.4** Privacy Policy, Terms, account deletion flow — deps: 2.9 — draft texts marked for legal review (owner choice 2B) — PR #31 (2026-11-20)
- [x] **7.5** Accessibility + responsive checks — deps: 4.9 — PR #32 (2026-11-20)
- [x] **7.6** Load test & benchmark: submit→resolve p50/95/99, DB locks, Realtime latency — deps: 6.6 — Dev baseline, 20 concurrent players (owner choice 3A) — PR #33 (2026-11-20)
- [x] **7.7** Production smoke tests + incident/rollback runbook — deps: 7.1 — PR #34 (2026-11-20)
- [!] **7.8** Production deploy — Deferred by owner (2026-11-20) — requires owner approval + pre-launch items in `docs/platform/PLATFORM_SPEC.md`

**Acceptance:** no open Critical/High issues · test suite passes on staging · baseline scaling metrics recorded

## Phase 9 — Developer Admin

Owner request 2026-11-20 (dev tooling; production tasks 6.8/7.3/7.8 stay deferred). Owner decisions: catalog read-only, no character management, admin created in the Supabase Dashboard + server-side grant, MFA required.

- [x] **9.1** RBAC foundation: `private.admin_roles`, append-only `private.admin_audit_log`, idempotent `grant_admin`/`revoke_admin` bootstrap, `admin-api` with server-side role + MFA (aal2) checks — deps: 8.14 — PR #57 (2026-11-20)
- [x] **9.2** Admin dashboard UI (`/admin`): MFA enroll/verify, Overview, Players, Cards, Decks, Rooms, Matches, Bots, Logs, Settings (iPhone + desktop) — deps: 9.1 — PR #57 (2026-11-20)
- [x] **9.3** Bootstrap the Dev admin + `AUMMON_ENV` on Dev; owner logs in with MFA — deps: 9.1, 9.2 — PR #59 (2026-11-20) — owner confirmed login with MFA

- [x] **9.4** Readable admin dashboard: Thai labels/explanations, stat cards, card lists instead of raw tables, system health page — deps: 9.3 — PR #60 (2026-11-20)
- [x] **9.5** Overview: "logged in now" card (sessions active in the last hour) + recent events limited to 10 — deps: 9.4 — PR #61 (2026-11-20)
- [x] **9.6** Rooms: close any open room (unfinished game abandoned), server-computed stale reason (empty / expired / finished / idle 2 h), "close all stale" — deps: 9.5 — PR #62 (2026-11-20)
- [x] **9.7** Thai card names, keywords and card text in game + admin (owner request; display only, no rule change) — deps: 9.6 — PR #63 (2026-11-20)
- [x] **9.8** Game screen: tap a card → command popup; 📜 history and ⚙️ settings (rules, forfeit) popups top-right; heart/energy icons with numbers, opponent hand as card backs, deck pile with remaining count — deps: 9.7 — PR #64 (2026-11-20)
- [x] **9.9** Fix settings → rules/forfeit doing nothing; in-popup forfeit confirmation; synthesized sound effects for game actions with mute toggle — deps: 9.8 — PR #65 (2026-11-20)
- [x] **9.11** Admin sound settings: 17-sound library, per game moment choose sound / volume 0–200% / on-off with preview; global for all players (`public.game_settings`, admin-only audited writes) — deps: 9.9 — PR #67 (2026-11-20)
- [x] **9.12** Home: "วิธีเล่น & กติกา" button → rules popup (secondary style, works signed out) — deps: 9.9 — PR #68 (2026-11-20)
- [x] **9.13** Color Design System — Theme A Balanced: global + semantic tokens, lobby, battlefield (player/opponent areas, slots, targets), card frame, buttons, HP/SPARK, 6 keyword badges, effects, alerts, popups; `docs/platform/PLATFORM_SPEC.md` — deps: 9.12 — PR #69 (2026-11-21)
- [x] **9.14** Game screen layout B (owner choice): full-screen, sticky top bar, field fits without page scroll, hand drawer at the bottom (fan when folded, auto-opens on your turn), compact deck chips (layout A), end-turn button left of your HP — deps: 9.13 — PR #70 (2026-11-21)
- [x] **9.15** Game screen: history grouped by turn (newest first); server bot paced one action per step (700 ms); drag & drop from hand (unit → empty slot summons, equipment → your unit attaches, actions → command popup); playable cards sorted first — deps: 9.14 — PR #71 (2026-11-21)
- [x] **9.16** Game screen tweaks: rules button in top bar (left of history, removed from settings); exhausted label shows only "💤 เหนื่อย"; folded hand drawer opens by tapping anywhere incl. cards — deps: 9.15 — PR #72 (2026-11-21)
- [x] **9.17** Fix: game sounds silent (browser audio lock) — audio unlocked/resumed on every tap so server-driven sounds (bot steps, polls) can play — deps: 9.16 — PR #73 (2026-11-21)
- [x] **9.18** Tap sounds on the game screen: one shared tap sound for every button; separate sounds for card tap, hand open, hand close (admin-configurable) — deps: 9.17 — PR #74 (2026-11-21)

**Acceptance:** admin logs in without Register · non-admins get 403 on every admin action · players cannot self-grant · MFA enforced server-side · audited mutations · no secret in the client bundle · per-environment bootstrap documented (`docs/platform/PLATFORM_SPEC.md`)

## Phase 14 — AumMon Game Center (owner 2026-11-23)

Multi-game platform: EDO Battle (= Discard Edition) + Dummy + Texas Hold'em (play-money). Task detail, acceptance criteria and tests: (git history); architecture: (git history).

- [x] **14.0** GC0 Audit + architecture docs + owner decisions G1–G3 — deps: — — (2026-11-23)
- [x] **14.1** GC1 Platform foundation: Game Module Interface, registry, `public.games` + `game_id`, hub — deps: 14.0 — PR #106 (2026-11-23)
- [x] **14.2** GC2 EDO Battle behind the platform orchestrator, rename, results/stats, sweeper — deps: 14.1 — PR #106 (2026-11-23)
- [x] **14.3** GC3 Dummy engine — deps: 14.1 — PR #106 (2026-11-23); basic defaults approved by owner (2026-11-23)
- [x] **14.4** GC4 Dummy bots, server, UI, matchmaking — deps: 14.2, 14.3 — PR #106 (2026-11-23)
- [x] **14.5** GC5 Poker engine — deps: 14.1 — PR #106 (2026-11-23); basic defaults approved by owner (2026-11-23)
- [x] **14.6** GC6 Poker bots, server, UI (no ledger needed: chips live in a match) — deps: 14.2, 14.5 — PR #106 (2026-11-23)
- [x] **14.7** GC7 Central admin game management — deps: 14.2 — PR #106 (2026-11-23); scoped roles (GC7.3) wait for the owner
- [x] **14.8** GC8 Full integration testing — deps: 14.4, 14.6, 14.7 — PR #106 + Dev load/smoke (2026-11-23)
- [x] **14.10** Dummy ruleset "2" (ทิ้งโง่ −50 / speto −100), knock button, hand sorting; engine 8.0.0 — deps: 14.4 — PR #113 (2026-11-23)
- [x] **14.11** Dummy ruleset "3" (ทิ้งเต็ม −50 / speto −100), tap the stock pile to draw; engine 9.0.0 — deps: 14.10 — PR #114 (2026-11-23)
- [x] **14.12** Dummy ruleset "4" (ทิ้งโง่ = next player picks my discard alone and knocks), hold-drag hand reorder, pick-from-pile fix; engine 10.0.0 — deps: 14.11 — PR #115 (2026-11-23)
- [x] **14.13** Dummy ruleset "5" (ace only high: Q-K-A, no A-2-3), meld owner label, yellow head card; engine 11.0.0 — deps: 14.12 — PR #116, #117 (2026-11-23)
- [!] **14.9** GC9 Production readiness — owner-gated (6.8, 7.3, 7.8, legal check for play-money poker)

**Acceptance:** EDO Battle unchanged (golden replay + existing suites) · each game isolated with its own rules/bots · solo, private room and quick match per game · server-authoritative hidden information · central admin for all games

## Phase 15 — Product Direction v2: guest-first party platform (owner 2026-11-25)

Plan, dependencies and MVP scope: `docs/platform/PLATFORM_SPEC.md` §5. Phases 3, 5, 6 and 9 of the audit (15.3, 15.5, 15.6, 15.9) may run in parallel after 15.2.

- [x] **15.1** Repository audit + owner approval (Q1–Q8 defaults) — deps: — — PR #118 (2026-11-25)
- [x] **15.2** Product docs (vision, strategy, requirements, compatibility, handoff), spec v15; Dummy / Poker retired (code removed, rows kept) — deps: 15.1 — PR #119 (2026-11-25)
- [x] **15.5** UI/UX guidelines (dark theme) + clickable prototype → owner review — deps: 15.3 — PR #126 (2026-11-25)
- [x] **15.6** Guest-first architecture + account linking design (anonymous auth, RLS) → owner approval — deps: 15.2 — PR #123 (2026-11-25)
- [x] **15.7** Casual & Ranked architecture; SDK simultaneous-decision design — deps: 15.6 — PR #124 (2026-11-25)
- [x] **15.8** XP, rank, economy, monetization + cost model (design only) — deps: 15.7 — PR #125 (2026-11-25)
- [x] **15.10** Technical migration plan + test strategy → owner approval — deps: 15.4–15.9 — PR #127 (2026-11-25)
- [x] **15.11** MVP implementation (guest, Casual rooms, BLUFF, content, share) — deps: 15.10 — slices S1–S8, PRs #128–#131 (2026-11-25)
  - [x] S1 SDK simultaneous decisions + contract tests; flaky EDO solo backend test fixed — PR #128 (2026-11-25)
  - [x] S2 `bluff` engine module (ruleset "2", scoring per variant, tie-break, hidden view) — PR #129 (2026-11-25)
  - [x] S3 guest identity (M1, M4) + Home nickname + `requireAccount()` — PR #130 (2026-11-25)
  - [x] S4 Casual rooms 2–8 + settings (M2, M3, M7); BLUFF playable server-side — PR #130 (2026-11-25)
  - [x] S5 content tables + seed + selection + admin review (M5, M6) — PR #130 / #131 (2026-11-25)
  - [x] S6 BLUFF UI live + Results + share — PR #131 (2026-11-25)
  - [x] S7 account linking UI — PR #131 (2026-11-25)
  - [x] S8 v2 Home, EDO hidden (`/edo`), prototype removed, docs — PR #131 (2026-11-25)
- [ ] **15.14** Launch preparation (production project, legal, payments decision) — deps: 15.13, 6.8, 7.8

**Acceptance:** MVP requirements R1–R8 met (`docs/platform/PLATFORM_SPEC.md` §4) · BLUFF tested at 2, 3–4 and 5–8 players · no client-decided result · guests play without sign-up · CI green.

## Phase 16 — Unified site & docs (owner 2026-11-27)

- [x] **16.1** One dark AumMon theme + shell for both games (settings, sounds, back, auth kept) — deps: 15.11 — PR #138 (2026-11-27)
- [x] **16.2** Docs merged: platform spec / roadmap + per-game spec / roadmap; obsolete files removed; token rules updated — deps: 16.1 — PR #139 (2026-11-27)
