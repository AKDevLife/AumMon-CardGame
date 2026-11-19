# AumMon — Development Roadmap

Source: `aummon_project_blueprint.md` §9 (phases), §14 (first sprint); rules: `aummon_game_spec.md`.
Format: `- [ ] **P.N** task — deps: …` · `[x]` = verified complete · `⏳ In progress` · `🔒 Blocked: reason`.
Percentages: `pnpm progress` (top-level tasks only). Phase 0 (Rulebook v1 decisions) is complete in Spec v2.1.

## Phase 1 — Project Foundation

- [x] **1.1** pnpm monorepo + TypeScript strict project references
- [x] **1.2** React + Vite + Tailwind app shell with UI tokens (spec §5) — deps: 1.1
- [x] **1.3** ESLint (incl. game-engine isolation rules) + Prettier — deps: 1.1
- [x] **1.4** Vitest (engine/architecture/web) + Playwright smoke test — deps: 1.2
- [x] **1.5** `packages/game-engine` skeleton + architecture isolation test — deps: 1.3
- [x] **1.6** Supabase CLI local config (`supabase init`, `private` not exposed) — deps: 1.1
- [x] **1.7** GitHub Actions CI: typecheck, lint, format, test, build, secret scan, E2E — deps: 1.4
- [x] **1.8** Secret guard script, README, `.env.example` — deps: 1.7
- [x] **1.9** Claude operating rules + progress tracking system
- [ ] **1.10** Supabase Dev project + `supabase link` — 🔒 Blocked: needs project ref, access token and network access to Supabase
- [x] **1.11** Vercel Preview per PR (verified PR #9); Production auto-deploy disabled via `vercel.json`
- [ ] **1.12** Branch protection on `main` requiring CI — 🔒 Blocked: owner repo settings

### UI Preview track (parallel; no backend, engine or DB work)

- [x] **1.13** Main layout + router (iPhone safe areas, `100dvh`, touch targets) — deps: 1.2
- [x] **1.14** Home, Login, Register UI only — forms disabled, "UI Preview — ยังไม่เชื่อมระบบจริง" banner on every page (real auth: 2.8–2.9) — deps: 1.13
- [x] **1.15** `vercel.json`: SPA rewrites, security headers, `noindex`, auto-deploy from `main` disabled (no Production) — deps: 1.14
- [x] **1.16** Responsive E2E: iPhone 13 viewport, no horizontal scroll, screenshots — deps: 1.14

**UI Preview acceptance:** PR Preview URL opens on iPhone; no Production deployment; no secrets in bundle.

**Acceptance (blueprint §9 Phase 1):** PRs pass CI ✅ · Deploy Preview works (1.11) · no secrets in client bundle or Git ✅

## Phase 2 — Auth & Database Foundation

- [x] **2.1** Migration: `public`/`private` schemas, core tables, composite FKs, indexes (blueprint §3.4) — deps: 1.6
  - [x] `deck_templates` PK `(id, version)`; composite FKs from `deck_template_cards`, `matches`
  - [x] RLS enabled on all `public` tables (deny-all until 2.4); `private` revoked from anon/authenticated, granted to service_role
  - [x] pgTAP tests + `pnpm db:test` + CI `database` job
- [x] **2.2** `profiles` auto-create trigger + `updated_at` triggers — deps: 2.1
- [ ] **2.3** Grants review for `public` tables (least privilege for anon/authenticated); `private` grants done in 2.1 — deps: 2.1
- [ ] **2.4** RLS policies for all `public` tables + `is_match_member` helper — deps: 2.3
- [ ] **2.5** Seed: 4 characters, card definitions, deck template v1 (16/10/8/6) — deps: 2.1
  - [ ] Chaos split 2/2/2 + card IDs per clarification Q1 (provisional)
- [ ] **2.6** SQL/RLS tests: User A, User B, anonymous, non-member — deps: 2.4
- [ ] **2.7** Browser Supabase client + env validation — deps: 2.1
- [ ] **2.8** Sign up / Login / Logout / session handling UI — deps: 2.7
- [ ] **2.9** Profile create/update UI (display name validation) — deps: 2.8
- [ ] **2.10** E2E: sign up → login → profile — deps: 2.9

**Acceptance:** A cannot read/edit B's private profile · non-member cannot read a match · browser cannot read `private` schema · migrations + seed reproducible

## Phase 3 — Pure Game Engine

- [ ] **3.1** Full domain model: card instances, zones, submissions, skill state — deps: 1.5
- [ ] **3.2** Seeded deterministic `RandomSource` implementation — deps: 3.1
- [ ] **3.3** Deck/hand/discard: initial 3, max 5, skip draw at 5, reshuffle, empty-deck safe (Rules 7–8) — deps: 3.2
- [ ] **3.4** Character registry + hook/effectKey validation (config error on mismatch) — deps: 3.1
- [ ] **3.5** Action validator + legal actions (target, choice, ownership) — deps: 3.3
- [ ] **3.6** Card effects: attack, defense shield, support heal/draw (Rules 3, 4, 6) — deps: 3.5
- [ ] **3.7** Chaos effects: Redirect, AoE, Disrupt (Rule 5; clarifications Q1–Q3, Q5) — deps: 3.6
- [ ] **3.8** Character skills: Pyro, Aqua, Breeze, Terra (Rules 9–12; clarifications Q4, Q5, Q7) — deps: 3.4, 3.6
- [ ] **3.9** Round resolver: speed/seat order, elimination, `onRoundEnd`, win/draw (Rules 1, 12, 13, 15) — deps: 3.6
- [ ] **3.10** Player view builder (allow-list, no private data) — deps: 3.1
- [ ] **3.11** Rule-based bot strategy (legal actions only, seat-limited view) — deps: 3.5, 3.10
- [ ] **3.12** Timeout auto-bot action selection (Rule 14) — deps: 3.11
- [ ] **3.13** Scenario tests 2–4 players + property tests (card conservation, HP bounds) — deps: 3.9

**Acceptance:** scenarios run without browser/DB · engine has no Supabase/UI deps · tests cover spec §9 DoD list

## Phase 4 — Solo Vertical Slice

- [ ] **4.1** Engine import into Edge Functions (Deno) — verify approach — deps: 3.1
- [ ] **4.2** `_shared`: JWT auth, input validation, CORS, errors, engine↔DB adapter — deps: 4.1, 2.4
- [ ] **4.3** DB functions: `claim_resolution`, `commit_round`, command receipts (idempotency) — deps: 2.1
- [ ] **4.4** Timer mechanism for 30s timeout + resolver lease recovery — deps: 4.3
- [ ] **4.5** `rooms-create` (solo) + `matches-start` with server bot seats — deps: 4.2
- [ ] **4.6** `matches-submit-action` (validation list blueprint §4.5) — deps: 4.3, 4.5
- [ ] **4.7** `matches-view` (filtered `PlayerGameView`) — deps: 4.5
- [ ] **4.8** Server-side bot execution in match flow — deps: 3.11, 4.6
- [ ] **4.9** Game UI: board, hand, target/choice select, reveal/resolve animation, result — deps: 4.7
- [ ] **4.10** Security tests: must-pass attacks 1–8, 10 (blueprint §10) — deps: 4.8
- [ ] **4.11** E2E: sign up → solo match → match complete — deps: 4.9
- [ ] **4.12** `turn_start` phase + `matches-use-skill` command for Aqua (clarification Q7) — deps: 3.8, 4.6

**Acceptance:** 1 player + bots play to the end · bots run server-side with legal actions only · client cannot fake HP/damage/target

## Phase 5 — Pass & Play

- [ ] **5.1** Local seats (no `user_id`) owned by room owner — deps: 4.5
- [ ] **5.2** Server-side current-seat control — deps: 5.1
- [ ] **5.3** Privacy Handoff UI + state obscure/reset between seats — deps: 5.2
- [ ] **5.4** Shared-device limitation notice — deps: 5.3
- [ ] **5.5** E2E: 2–4 local seats play to the end — deps: 5.3

**Acceptance:** 2–4 players finish on one device · previous seat's hand not shown normally · limitation explained

## Phase 6 — Online Multiplayer

- [ ] **6.1** Create/join lobby; join code random, hashed, expiring, rate-limited — deps: 4.2
- [ ] **6.2** Ready / start / leave (`rooms-ready`, `rooms-leave`) — deps: 6.1
- [ ] **6.3** Private Realtime channels + authorization; Presence online/offline — deps: 6.1
- [ ] **6.4** Reconnect / resume (`matches-resume`) + forfeit (`matches-forfeit`) — deps: 6.3
- [ ] **6.5** Disconnect/timeout 30s → server bot, regain control next round (Rule 14) — deps: 4.4, 6.4
- [ ] **6.6** Concurrency tests: duplicate/simultaneous submits, single resolver — deps: 6.5
- [ ] **6.7** E2E: two-browser online match — deps: 6.5
- [ ] **6.8** Staging Supabase project separate from production — 🔒 Blocked: owner account, may exceed free tier

**Acceptance:** 2–4 accounts on different devices · cannot read opponent hand/submission · duplicate/concurrent commands never double-resolve

## Phase 7 — Public Launch & Scale Evaluation

- [ ] **7.1** Security review + abuse checks (rate limits, CORS, CSP, headers) — deps: 6.7
- [ ] **7.2** Error tracking / monitoring + scaling metrics (blueprint §11.4) — deps: 6.7
- [ ] **7.3** Backup + restore test — deps: 6.8
- [ ] **7.4** Privacy Policy, Terms, account deletion flow — deps: 2.9
- [ ] **7.5** Accessibility + responsive checks — deps: 4.9
- [ ] **7.6** Load test & benchmark: submit→resolve p50/95/99, DB locks, Realtime latency — deps: 6.6
- [ ] **7.7** Production smoke tests + incident/rollback runbook — deps: 7.1
- [ ] **7.8** Production deploy — 🔒 Blocked: requires owner approval

**Acceptance:** no open Critical/High issues · test suite passes on staging · baseline scaling metrics recorded
