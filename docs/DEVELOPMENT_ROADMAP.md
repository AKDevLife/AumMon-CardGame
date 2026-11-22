# AumMon — Development Roadmap

Source: `aummon_project_blueprint.md` §9 (phases), §14 (first sprint); rules: `aummon_game_spec.md`.
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

## Phase 8 — 1v1 TCG Ruleset (Spec v3.0, `ruleset_version = "2"`)

Owner decision 2026-11-20: replace the 2–4 player game with the 1v1 TCG in `aummon_game_spec.md` (Core Rules V1.1). Auth, menus, lobby, UI design system and platform stay as they are.

- [x] **8.1** Consolidate spec into `aummon_game_spec.md` v3.0; align blueprint, rules and docs — deps: — — PR #41 (2026-11-20)
- [x] **8.2** Card data: 25 card definitions, 11 recipes, Starter Deck as typed data + validation tests (power budget, ≤3 copies, recipe graph) — deps: 8.1 — PR #43 (2026-11-20)
- [x] **8.3** Engine v2 core: setup, mulligan, SPARK, 3-phase turn, summon, fatigue, win/draw, client-safe view — deps: 8.2 — PR #44 (2026-11-20)
- [x] **8.4** Combat + keywords (Haste, Guard, Flying, Piercing, Boost) — deps: 8.3 — PR #45 (2026-11-20)
- [x] **8.5** Actions + Equipment (Draw, Search, Scrap Return, slots, compatibility) — deps: 8.3 — PR #46 (2026-11-20)
- [x] **8.6** Evolution + Fusion (instance rules, full HP, equipment handling, inheritance) — deps: 8.4, 8.5 — PR #47 (2026-11-20)
- [x] **8.7** Scenario tests T-001–T-007 + spec §5.17 acceptance + determinism/simulation — deps: 8.6 — PR #48 (2026-11-20) — §5.17 #11, #12, #15 (triggers, target loss, loop limit) N/A: no triggered effects in the V1.1 card set
- [x] **8.8** Server bot v2 (legal actions only, seat-visible data) — deps: 8.7 — PR #49 (2026-11-20)
- [x] **8.9** DB migration + seed for ruleset 2 (definitions, recipes, match state/events, RLS) — deps: 8.2 — PR #50 (2026-11-20)
- [x] **8.10** Backend: turn-based commands, 90 s turn timer → auto end turn, idempotency — deps: 8.8, 8.9 — PR #51 (2026-11-20)
- [x] **8.11** UI: 1v1 board + Solo mode — deps: 8.10 — PR #52 (2026-11-20)
- [x] **8.12** Pass & Play 1v1 (privacy handoff per turn, no timer) — deps: 8.11 — PR #53 (2026-11-20)
- [x] **8.13** Online 1v1 (lobby 2 seats, realtime, resume, forfeit, timer) — deps: 8.11 — PR #54 (2026-11-20)
- [x] **8.14** Retire ruleset 1 code paths; E2E + smoke + load test on Dev — deps: 8.12, 8.13 — PR #55, #56 (2026-11-20) — DB tables of ruleset 1 kept (no destructive migration)

**Acceptance:** all three modes playable 1v1 to the end on Dev · scenario tests T-001–T-007 pass · no hidden info leaks (hand, deck order, search) · `pnpm check`, E2E and CI green

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

## Phase 10 — Everyday Objects Battle (`ruleset_version = "3"`)

Owner-approved direction 2026-11-21 (R3 in `docs/rule-clarifications.md`, rules in `aummon_game_spec.md` v4.0).

- [x] **10.1** Decisions D1–D11 recorded; Object/Ability framework + 24-card prototype set + Starter Deck v3 designed; Phase 10 plan — deps: 9.18 — PR #75 (2026-11-21)
- [x] **10.2** Engine ruleset 3 (pure TS): Object cards, 1 Passive + 1 Active, triggers, effects, durations, safety limits, card data validation, bot; simulation of the framework cards then the 24-card set — deps: 10.1 — PR #76 (2026-11-21)
- [x] **10.3** Database + server: additive migration for ruleset 3 cards / starter deck, seed, Edge Functions run ruleset 3 for new matches (`activate` command) — deps: 10.2 — PR #77 (2026-11-21)
- [x] **10.4** UI: Object card frame with Passive/Active text, activate flow with targets, rules popup, sounds, placeholder Living-Objects art — deps: 10.3 — PR #77 (2026-11-21)
- [x] **10.5** Remove ruleset 2 (Evolution, Fusion, Equipment, Action, recipes tables, old cards, tests); Game Spec v4.0 + blueprint/domain rules updated — deps: 10.4 — PR #78 (2026-11-21)
- [ ] **10.6** Owner playtest on Dev; balance pass — deps: 10.5

- [x] **11.1** Owner changes: free Active abilities (ruleset "4", spec v5.0) with higher summon costs for strong cards and Turbo "sleeps at end of turn"; "เหนื่อย" → "หลับ"; Thai category names; "All cards" gallery (home + in game, filter by category, tap for details); history button moved into settings — deps: 10.5 — PR #79 (2026-11-21)
- [x] **11.2** Categories: ภาชนะ → ที่เก็บของ; ของใช้ในบ้าน → อิสระ (FREE: no other category); Bottle Rocket not a vehicle; Vacuum electronic only (ruleset stays "4", owner choice) — deps: 11.1 — PR #80 (2026-11-21)
- [x] **11.3** Hand and "All cards" gallery sorted by SPARK cost, cheapest first (same cost: playable first) — deps: 11.2 — PR #81 (2026-11-21)
- [x] **11.4** Owner rules update (ruleset "5", spec v6.0): actions in any order; Active usable while asleep, no sleep on use, once per turn; Guard works while asleep and must be hit first; no Guard + Flying; rules popup rewritten in the owner's words — deps: 11.3 — PR #82 (2026-11-21)
- [x] **11.5** Balance pass (card data only, ruleset "5"): 8,000-game bot simulation; replaced abilities that do nothing under ruleset 5 (Door, Alarm Clock, Power Strip), toned down / buffed costs and stats; win rate when drawn 38–56 % → 47–54 % — deps: 11.4 — PR #83 (2026-11-21)
- [x] **11.6** Save GitHub Actions minutes: CI only on pull requests (no duplicate run on main), docs-only changes skip CI — deps: 11.5 — PR #84 (2026-11-21)
- [x] **11.7** First-player balance (ruleset "6", spec v7.0): first player cannot attack on turn 1; second player opens with 6 cards and +1 SPARK on their first turn — simulated first-player win 70 % → 51 % — deps: 11.6 — PR #85 (2026-11-22)
- [x] **11.8** Rules state card counts (deck 30, max 3 copies, hand 10, field 3); tap sounds on every button app-wide; synthesized background music (on by default) with a ⚙️ settings popup on the home page and in game (effects + music switches) — deps: 11.7 — PR #86 (2026-11-22)
- [x] **11.9** Fix: in-app links (home play-mode buttons) had no tap sound (router preventDefault); background music volume doubled — deps: 11.8 — PR #87 (2026-11-22)

**Acceptance:** only ruleset 3 playable in all 3 modes · every handoff §10.2 case covered by engine tests · 1,000 simulated bot matches without errors · E2E + a11y pass · spec v4.0 is the single authoritative rule source
