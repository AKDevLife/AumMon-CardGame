# AumMon — Development Roadmap

Architecture: `aummon_project_blueprint.md`; rules: `aummon_game_spec.md` → `docs/discard/`.
Format: `- [ ] **P.N** task — deps: … — PR #n (date)` · `[ ]` not started · `[~]` in progress · `[x]` completed (verified) · `[!]` blocked (reason inline).
Percentages: `pnpm progress` (top-level tasks only). Phase 0 (Rulebook v1 decisions) is complete in Spec v2.1.

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

## Phase 3 — Pure Game Engine

- [x] **3.1** Full domain model: card instances, zones, submissions, skill state — deps: 1.5 — PR #19 (2026-11-19)
- [x] **3.2** Seeded deterministic `RandomSource` implementation — deps: 3.1 — PR #19 (2026-11-19)
- [x] **3.3** Deck/hand/discard: initial 3, max 5, skip draw at 5, reshuffle, empty-deck safe (Rules 7–8) — deps: 3.2 — PR #19 (2026-11-19)
- [x] **3.4** Character registry + hook/effectKey validation (config error on mismatch) — deps: 3.1 — PR #19 (2026-11-19)
- [x] **3.5** Action validator + legal actions (target, choice, ownership) — deps: 3.3 — PR #19 (2026-11-19)
- [x] **3.6** Card effects: attack, defense shield, support heal/draw (Rules 3, 4, 6) — deps: 3.5 — PR #19 (2026-11-19)
- [x] **3.7** Chaos effects: Redirect, AoE, Disrupt (Rule 5; clarifications Q1–Q3, Q5) — deps: 3.6 — PR #19 (2026-11-19)
- [x] **3.8** Character skills: Pyro, Aqua, Breeze, Terra (Rules 9–12; clarifications Q4, Q5, Q7) — deps: 3.4, 3.6 — PR #19 (2026-11-19)
- [x] **3.9** Round resolver: speed/seat order, elimination, `onRoundEnd`, win/draw (Rules 1, 12, 13, 15) — deps: 3.6 — PR #19 (2026-11-19)
- [x] **3.10** Player view builder (allow-list, no private data) — deps: 3.1 — PR #19 (2026-11-19)
- [x] **3.11** Rule-based bot strategy (legal actions only, seat-limited view) — deps: 3.5, 3.10 — PR #19 (2026-11-19)
- [x] **3.12** Timeout auto-bot action selection (Rule 14) — deps: 3.11 — PR #19 (2026-11-19)
- [x] **3.13** Scenario tests 2–4 players + property tests (card conservation, HP bounds) — deps: 3.9 — PR #19 (2026-11-19)

**Acceptance:** scenarios run without browser/DB · engine has no Supabase/UI deps · tests cover spec §9 DoD list

## Phase 4 — Solo Vertical Slice

- [x] **4.1** Engine import into Edge Functions (Deno) — verify approach — deps: 3.1 — PR #20 (2026-11-19)
- [x] **4.2** `_shared`: JWT auth, input validation, CORS, errors, engine↔DB adapter — deps: 4.1, 2.4 — PR #21 (2026-11-19)
- [x] **4.3** DB functions: `claim_resolution`, `commit_round`, command receipts (idempotency) — deps: 2.1 — PR #21 (2026-11-19)
- [x] **4.4** Timer mechanism for 30s timeout + resolver lease recovery — deps: 4.3 — PR #21 (2026-11-19)
- [x] **4.5** `rooms-create` (solo) + `matches-start` with server bot seats — deps: 4.2 — PR #21 (2026-11-19)
- [x] **4.6** `matches-submit-action` (validation list blueprint §4.5) — deps: 4.3, 4.5 — PR #21 (2026-11-19)
- [x] **4.7** `matches-view` (filtered `PlayerGameView`) — deps: 4.5 — PR #21 (2026-11-19)
- [x] **4.8** Server-side bot execution in match flow — deps: 3.11, 4.6 — PR #21 (2026-11-19)
- [x] **4.9** Game UI: board, hand, target/choice select, reveal/resolve animation, result — deps: 4.7 — PR #22 (2026-11-19)
- [x] **4.10** Security tests: must-pass attacks 1–8, 10 (blueprint §10) — deps: 4.8 — attacks 1–8, 10 covered (HTTP, engine, recovery determinism); 9 in Phase 6 — PR #23 (2026-11-19)
- [x] **4.11** E2E: sign up → solo match → match complete — deps: 4.9 — PR #22 (2026-11-19)
- [x] **4.12** `turn_start` phase + `matches-use-skill` command for Aqua (clarification Q7) — deps: 3.8, 4.6 — PR #21, #22 (2026-11-19)

**Acceptance:** 1 player + bots play to the end · bots run server-side with legal actions only · client cannot fake HP/damage/target

## Phase 5 — Pass & Play

- [x] **5.1** Local seats (no `user_id`) owned by room owner — deps: 4.5 — PR #23 (2026-11-19)
- [x] **5.2** Server-side current-seat control — deps: 5.1 — PR #23 (2026-11-19)
- [x] **5.3** Privacy Handoff UI + state obscure/reset between seats — deps: 5.2 — PR #23 (2026-11-19)
- [x] **5.4** Shared-device limitation notice — deps: 5.3 — PR #23 (2026-11-19)
- [x] **5.5** E2E: 2–4 local seats play to the end — deps: 5.3 — PR #23 (2026-11-19)

**Acceptance:** 2–4 players finish on one device · previous seat's hand not shown normally · limitation explained

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
- [!] **7.8** Production deploy — Deferred by owner (2026-11-20) — requires owner approval + pre-launch items in `docs/SECURITY_REVIEW.md`

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
- [x] **9.13** Color Design System — Theme A Balanced: global + semantic tokens, lobby, battlefield (player/opponent areas, slots, targets), card frame, buttons, HP/SPARK, 6 keyword badges, effects, alerts, popups; `docs/color_design_system.md` — deps: 9.12 — PR #69 (2026-11-21)
- [x] **9.14** Game screen layout B (owner choice): full-screen, sticky top bar, field fits without page scroll, hand drawer at the bottom (fan when folded, auto-opens on your turn), compact deck chips (layout A), end-turn button left of your HP — deps: 9.13 — PR #70 (2026-11-21)
- [x] **9.15** Game screen: history grouped by turn (newest first); server bot paced one action per step (700 ms); drag & drop from hand (unit → empty slot summons, equipment → your unit attaches, actions → command popup); playable cards sorted first — deps: 9.14 — PR #71 (2026-11-21)
- [x] **9.16** Game screen tweaks: rules button in top bar (left of history, removed from settings); exhausted label shows only "💤 เหนื่อย"; folded hand drawer opens by tapping anywhere incl. cards — deps: 9.15 — PR #72 (2026-11-21)
- [x] **9.17** Fix: game sounds silent (browser audio lock) — audio unlocked/resumed on every tap so server-driven sounds (bot steps, polls) can play — deps: 9.16 — PR #73 (2026-11-21)
- [x] **9.18** Tap sounds on the game screen: one shared tap sound for every button; separate sounds for card tap, hand open, hand close (admin-configurable) — deps: 9.17 — PR #74 (2026-11-21)

**Acceptance:** admin logs in without Register · non-admins get 403 on every admin action · players cannot self-grant · MFA enforced server-side · audited mutations · no secret in the client bundle · per-environment bootstrap documented (`docs/ADMIN.md`)

## Retired — 1v1 TCG (Phases 8, 10, 11; rulesets 2–6)

Built 2026-11-20 → 2026-11-21 (PRs #50–#87) and removed in task 12.4 when the owner replaced the game with the Casual Discard Edition. Details: git history and `docs/DEVELOPMENT_CHANGELOG.md`.

## Phase 12 — Casual Discard Edition (new game, owner 2026-11-22)

Owner brief: shedding-type card game for 2–8 players with the 16 Everyday Objects. Docs in `docs/discard/`; decisions DC1–DC7 in `docs/discard/AumMon_Rule_Clarification.md`. Login, profiles, UI kit, sounds and admin stay.

- [x] **12.1** Phase 1 audit (simulation: base rule stalls — 0.1–5 % of games finish; pile reset → ~100 %) + owner decisions DC1–DC7 + Core Rules + Card Library — deps: 11.9 — PR #88 (2026-11-22)
- [x] **12.2** Engine prototype (pure TS, data-driven cards, reactions) + simulation 2–8 players, balance report `AumMon_Card_Balance.md` — deps: 12.1 — PR #89 (2026-11-22)
- [x] **12.3** Architecture, database schema and test plan docs for 2–8 player rooms (blueprint rewritten) — deps: 12.2 — PR #90 (2026-11-22)
- [x] **12.4** Backend: N-player rooms (2–8), turn direction, reactions, private reveals, bots, timers; cleanup migration drops TCG tables/data — deps: 12.3 — PR #90 (2026-11-22)
- [x] **12.5** UI: table for 2–8 players, discard pile, hand, reactions, reveals, rules + card gallery, sounds — deps: 12.4 — PR #90 (2026-11-22)
- [x] **12.6** Remove the 1v1 TCG (ruleset 6) code, tests and docs; all modes play the new game — deps: 12.5 — PR #90 (2026-11-22)
- [ ] **12.7** VIP + cosmetic gacha design doc (no payments until legal check + owner approval) — deps: 12.1
- [ ] **12.8** Owner playtest on Dev; balance pass — deps: 12.6

**Acceptance:** all 3 modes play the Discard Edition with 2–8 seats · games always finish in simulation · server-authoritative hidden hands · no pay-to-win

## Phase 13 — AI Art Production (owner 2026-11-22)

Pipeline in `docs/art-production/`; images are made by the owner in an external AI image tool with prompts from the Prompt Library; Claude does QA, tracking and integration. Owner approves direction, Style Bible and every character.

- [x] **13.1** Art pipeline: Art Direction proposals, Style Bible draft, 16 character proposals, Prompt Library, QA guidelines, workflow, Asset Catalog + tracker, folders, Master Handoff — deps: 12.6 — PR #91 (2026-11-22)
- [ ] **13.2** Owner chooses the Art Direction (IMG-DIR-01 tests) — deps: 13.1
- [ ] **13.3** Style Bible v1.0 locked with approved sample sheet — deps: 13.2
- [ ] **13.4** 16 character concepts approved (pilot AM013 first) — deps: 13.3
- [ ] **13.5** 16 reference sheets approved + lineup consistency check — deps: 13.4
- [ ] **13.6** 16 card artworks + card back approved — deps: 13.5
- [ ] **13.7** Integrate card art + card back into the game (emoji fallback) — deps: 13.6
- [ ] **13.8** Core UI art + menu / lobby / room / table backgrounds — deps: 13.6
- [ ] **13.9** Basic emotes (Priority 4; emote feature needs its own task) — deps: 13.7

**Acceptance:** every Integrated asset traces to an Approved master, prompt version and catalog row · all 16 characters pass the lineup check · art readable at in-game sizes · no text baked into art
