# AumMon Object Battle Card — Game Roadmap

Spec: `docs/games/object-battle/SPEC.md` (internal id `edo_battle`). Platform work is in `docs/platform/ROADMAP.md`.
Format: `- [ ] **P.N** task — deps: … — PR #n (date)` · `[ ]` not started · `[~]` in progress · `[x]` completed (verified) · `[!]` blocked (reason inline). Percentages: `pnpm progress` (all roadmaps, top-level tasks only).

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

## Phase 5 — Pass & Play (removed 2026-11-22, task 12.10)

- [x] **5.1** Local seats (no `user_id`) owned by room owner — deps: 4.5 — PR #23 (2026-11-19)
- [x] **5.2** Server-side current-seat control — deps: 5.1 — PR #23 (2026-11-19)
- [x] **5.3** Privacy Handoff UI + state obscure/reset between seats — deps: 5.2 — PR #23 (2026-11-19)
- [x] **5.4** Shared-device limitation notice — deps: 5.3 — PR #23 (2026-11-19)
- [x] **5.5** E2E: 2–4 local seats play to the end — deps: 5.3 — PR #23 (2026-11-19)

**Acceptance:** 2–4 players finish on one device · previous seat's hand not shown normally · limitation explained

## Retired — 1v1 TCG (Phases 8, 10, 11; rulesets 2–6)

Built 2026-11-20 → 2026-11-21 (PRs #50–#87) and removed in task 12.4 when the owner replaced the game with the Casual Discard Edition. Details: git history and `docs/DEVELOPMENT_CHANGELOG.md`.

## Phase 12 — Casual Discard Edition (new game, owner 2026-11-22)

Owner brief: shedding-type card game for 2–8 players with the 16 Everyday Objects. Docs in `docs/games/object-battle/SPEC.md`; decisions DC1–DC7 in `docs/games/object-battle/SPEC.md`. Login, profiles, UI kit, sounds and admin stay.

- [x] **12.1** Phase 1 audit (simulation: base rule stalls — 0.1–5 % of games finish; pile reset → ~100 %) + owner decisions DC1–DC7 + Core Rules + Card Library — deps: 11.9 — PR #88 (2026-11-22)
- [x] **12.2** Engine prototype (pure TS, data-driven cards, reactions) + simulation 2–8 players, balance report `AumMon_Card_Balance.md` — deps: 12.1 — PR #89 (2026-11-22)
- [x] **12.3** Architecture, database schema and test plan docs for 2–8 player rooms (blueprint rewritten) — deps: 12.2 — PR #90 (2026-11-22)
- [x] **12.4** Backend: N-player rooms (2–8), turn direction, reactions, private reveals, bots, timers; cleanup migration drops TCG tables/data — deps: 12.3 — PR #90 (2026-11-22)
- [x] **12.5** UI: table for 2–8 players, discard pile, hand, reactions, reveals, rules + card gallery, sounds — deps: 12.4 — PR #90 (2026-11-22)
- [x] **12.6** Remove the 1v1 TCG (ruleset 6) code, tests and docs; all modes play the new game — deps: 12.5 — PR #90 (2026-11-22)
- [x] **12.9** Gameplay screen redesign (mobile): header, opponents 2–8, center table, card states + preview, thumb-zone actions, animations, responsive tokens — deps: 12.6 — PR #92 (2026-11-22)
- [x] **12.10** Remove Pass & Play (owner 2026-11-22, DC8): UI, `game-create` pass_play, hand-off reveal, local seats; DB checks tightened — deps: 12.9 — PR #93 (2026-11-22)
- [x] **12.11** Quick Match analysis: duration analysis, 144k-game simulation on the real engine, balance impact, proposed rules (ruleset "8"), test plan — deps: 12.10 — PR #94 (2026-11-22)
- [x] **12.12** Quick Match ruleset "8" (owner approved QM1–QM6): engine 2.0.0 (hands 5 / 4, Draw Then Play `keep`, Alarm next-only), 20 s / 5 s server timers + 0.5 s grace + Online auto-play after 2 timeouts, `serverNow`, `game-rematch`, UI (draw / play drawn / keep, 5 s warning, auto-play bar, rematch), docs — deps: 12.11 — PR #95 (2026-11-22)
- [x] **12.13** Quality 9–10 audit: 8 docs (audit, design upgrade, rule simplification, card balance review, player experience, tutorial design, playtest protocol, quality report) + simulation metrics and balance proposals — deps: 12.12 — PR #96 (2026-11-22)
- [x] **12.14** Ruleset "9" (owner approved Q1–Q4): Key 6, Umbrella 7, Trash no redraw, Flashlight 3 s; engine 3.0.0; Q2 simulation (B4B / B6B) — deps: 12.13 — PR #97 (2026-11-22)
- [x] **12.15** UI for quality (Q3): interactive tutorial (`/tutorial`, 7 steps, local engine), 4-line rules, short card text, Glue "1–3" text, Hourglass hint, "เหลือ 1 ใบ!" badge — deps: 12.14 — PR #98 (2026-11-22)
- [x] **12.16** Playtest telemetry (Q3): `private.round_stats` (duration, turns, timeouts, decision time, drawn plays, abilities, opening card ids, winner, rematch, leavers) + admin "สถิติเล่นทดสอบ" — deps: 12.14 — PR #99 (2026-11-22)
- [x] **12.17** Ruleset "10" (owner delegated the decision): Magnifier peek + play 1 more (B4B), Box puts 1 card of 1–3 points (B6C); engine 4.0.0; UI choices — deps: 12.14 — PR #100 (2026-11-22)
- [x] **12.18** Ruleset "11" (owner): 60 s turns, starting hands 7 / 5 (chosen from simulation); engine 5.0.0 — deps: 12.17 — PR #101 (2026-11-22)
- [x] **12.19** Online playtest fixes (owner): fresh 60 s timer every turn (bug), Flashlight reveal closes by hand + shows card abilities, Online next round through the room (ready again, player count, owner starts) — deps: 12.18 — PR #102 (2026-11-22)
- [x] **12.20** Ruleset "12" (owner): Flashlight sees one hand, Magnifier sees the top 2 draw cards, Fan = reverse only, Alarm = fewest-cards player draws 1, Key icon 🔒; spinner on action buttons; Glue proposals G1–G3 — deps: 12.19 — PR #103 (2026-11-22)
- [x] **12.21** Ruleset "13": กาวน้ำ = give 1 card to a chosen player (owner chose G2); engine 7.0.0; play dialog + bot + tutorial — deps: 12.20 — PR #104 (2026-11-22)
- [x] **12.7** VIP + cosmetic gacha design doc (no payments until legal check + owner approval) — deps: 12.1 — `docs/games/object-battle/SPEC.md`; build waits for owner Q1–Q5 + legal check — PR #105 (2026-11-22)
- [ ] **12.8** Owner playtest on Dev; balance pass — deps: 12.6

**Acceptance:** all 3 modes play the Discard Edition with 2–8 seats · games always finish in simulation · server-authoritative hidden hands · no pay-to-win
