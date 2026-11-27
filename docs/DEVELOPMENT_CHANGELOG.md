# AumMon — Development Changelog

Newest first. Significant changes only. About 15 entries; older ones are in git history (token-efficiency.md).

## 2026-11-27 — 15.13 BLUFF UX iteration (part 1, no human data)

- Result screen: equal scores show the tie-break (`หลอก+จริงใจ` points + note); engine view adds public `reads` (no rule / ruleset change). UI tolerates the old view until `game-view` is redeployed.
- `useMatch`: one failed poll (e.g. the 504 seen in the 8-player run) no longer flashes an error; shown after 2 in a row. Test `src/platform/useMatch.test.ts`.
- `scripts/bluff-playtest-report.sql`: per player count (claim / lie / AFK / hit %, points by source) + per item vote spread verdict.
- Remaining: balance, timers and item rewrites wait for human ratings; 2-player prediction hit 48 % to re-check.

## 2026-11-27 — 15.12 automated playtest / 15.13 blocked

- Playwright bots (360×740) played full matches on the playtest URL: 2 p (2.4 min), 4 p (3.5 min), 8 p slow ×1.5 + group (5.0 min). No page errors, no horizontal overflow, tab close/rejoin and AFK rounds recover.
- 1 of 2,747 `game-view` calls returned 504 during the 8-player run (shown as CORS in the browser); client recovered. Watch.
- Human Dev data: 4 × 2 p, 1 × 4 p; 2 p claim 23 % / lie 3 %, prediction hit 48 %. 23 items played, ≤ 7 votes each: too few for vote-spread rewrites. 15.13 blocked until human ratings + more matches. No rule or timer change.

## 2026-11-27 — 16.2 Docs merged (owner)

- One platform spec + roadmap (`docs/platform/`), one spec + roadmap per game (`docs/games/bluff/`, `docs/games/object-battle/`); progress + changelog stay project-wide. `pnpm progress` reads all roadmaps.
- Removed obsolete docs (v1 design analyses, Dummy / Poker rules, AI art pipeline + `art-production/`, audits, archive changelog, old handoff zip); all recoverable from git history. Applied migrations untouched.
- Token rules updated for the new layout.

## 2026-11-27 — 16.1 One dark AumMon theme + shell (owner)

- BLUFF palette for the whole site (tokens remapped once in `src/styles/index.css`); card faces stay light; bright fills get dark text. One header for every page: AumMon + game name, back / settings (sounds, music, home, profile, sign out) / login top right.

## 2026-11-27 — Platform hub at `/` (owner)

- `/` = AumMon game hub: AumMon BLUFF (`/bluff`) and AumMon Object Battle Card (`/edo`, EDO Battle un-hidden, BR1 display name). BLUFF "home" links now go to `/bluff`. Tests updated.

## 2026-11-27 — BR1–BR2 approved (owner)

- BR2: header and share texts say "AumMon BLUFF". BR1: "AumMon Object Battle Card" = EDO Battle's public name when it returns (internal id `edo_battle` unchanged).

## 2026-11-27 — Master brand architecture recorded (owner)

- `docs/platform/PLATFORM_SPEC.md` (v1.0 draft): AumMon = master brand + multi-game party platform; games AumMon BLUFF, AumMon Object Battle Card; IP actions for the owner; open BR1–BR2. Linked from the spec index.

## 2026-11-25 — Owner feedback: settings menu, room size, bots (BLUFF)

- Party header gets the settings menu top right again (tap sounds, music, home, profile, sign out); music + tap sounds on party pages.
- Create room: host picks 2–8 seats. Host can start with any number of ready humans (even alone); empty seats become **medium bots** (owner decision, replaces Q7 "no bots"): claim 50 % / taunt 20 % / pass 30 %, predict the most-claimed option, wager 1 only on agreement — public data only. Bots score and rank like players; no stats for bots. Bot rows are freed when the room returns to the lobby. AFK humans still get timeout defaults (M2), never a bot takeover.
- Tests: engine bot tests, backend "one guest + 3 bots" round, web unit for the size picker.

## 2026-11-25 — 15.12 playtest prepared

- Owner approved all 150 BLUFF items (applied on Dev, audited). Dev smoke: 3 guests start a match, read → claim advances on the server timer.
- `docs/games/bluff/SPEC.md`: sessions 2 / 4 / 8 players, what to report, what telemetry is read afterwards.

## 2026-11-25 — 15.11 S3–S8 MVP build (guests, BLUFF rooms, content, party UI)

- Backend (PR #130): anonymous sign-ins; `public.is_guest()` (public: RLS runs as `authenticated`); `requireCaller` / `requireAccount`; admin rejects guests; guest room limit 10/h. Migrations `20261126000000` (room `settings`, private content tables + history + reports, BLUFF registry, guest cleanup + pg_cron) and `20261126000100` (150 items as draft). BLUFF start picks 5 approved items (players / humor / group); responses include `pending`; no BLUFF bots; a left seat takes timeout defaults; `content-report`; admin `content` / `contentReview` (bulk) / `contentEdit`. Casual rooms reuse mode `online` (no new mode value).
- UI (PR #131): dark party shell; `/` nickname → create / join by code; `/join/:code`; lobby with share link + settings; live BLUFF (claim with option text, lock, reveal, scoreboard, results + share, report); `/me` nickname + account linking (same id, `email_exists` = no merge, blocked during a match); Admin "คำถาม BLUFF" review. EDO home moved to `/edo` (hidden, Q1); prototype route removed (T2).
- Dev deploy: migrations `20261126000000` + `20261126000100` applied to AumMon-Dev with history; anonymous sign-ins enabled; 15 Edge Functions deployed; smoke on Dev: guest sign-in, BLUFF room create/leave OK, guest → admin 403. Content is `draft` until the owner approves in Admin (C1).
- Tests: engine (BLUFF + SDK no-bot), pgTAP 015, backend `bluff.test.ts`, web unit `party.test.tsx`, Playwright `bluff.spec.ts` (2 guests on phones) + existing specs updated for the new home.

## 2026-11-25 — 15.11 S2 BLUFF engine module

- `packages/game-engine/src/bluff/` (`scoring.ts`, `module.ts`): ruleset "2", phases read → claim → lock → reveal → score × 5, final ×2, timeouts, tie-break, hidden view; content + slow timers via new `start(…, setup)`; registry `bluff`; engine 11.1.0. AFK seats without bots keep timeout defaults (flow). Tests `packages/game-engine/tests/bluff.test.ts`.

## 2026-11-25 — 15.11 S1 SDK simultaneous decisions

- `packages/game-engine/src/sdk`: optional `pendingSeats` / `tick` / `seatCount`, `bot` optional; `flow.advance` multi-seat path (one deadline per phase, bots at once, per-seat timeout defaults in seat order, tick phases); `pendingSeatsOf` / `seatCountOf` helpers. EDO single-seat path unchanged (golden replay green).
- Contract tests `packages/game-engine/tests/sdk-simultaneous.test.ts` (toy module). Admin bot simulation rejects games without bots.
- Fixed the known flaky `tests/backend/game.test.ts` solo check (a bot moving first can make seat 0 draw before the first view).

## 2026-11-25 — 15.10 Technical migration plan + test strategy (approved T1–T2)

- `docs/platform/PLATFORM_SPEC.md`: architecture impact, migrations M1–M8 (guest, seats 2–8, room settings, guest cleanup, content + seed, BLUFF registry, account-only guard), build slices S1–S8, risks. `docs/platform/PLATFORM_SPEC.md`; MASTER_ARCHITECTURE §13. Awaiting owner T1–T2.

## 2026-11-25 — 15.5 UI/UX guidelines + BLUFF prototype (approved U1–U3)

- `docs/platform/PLATFORM_SPEC.md`: dark party theme tokens (`.theme-party`, `party-*` Tailwind colours), screen list, copy tone; owner review U1–U3.
- Clickable mock prototype `src/features/prototype/BluffPrototype.tsx` at `/prototype/bluff` (Home → Lobby → Read → Claim → Lock → Reveal → Score → Results); unit test + Playwright phone-viewport test.

## 2026-11-25 — 15.8 XP, rank, economy, monetization (approved E1–E4; funny rank names หน้าใส → ราชันย์ตบตา)

- New `docs/v2/`: `AumMon_Level_XP_Design.md` (XP sources, anti-farm, level curve, missions), `AumMon_Rank_System.md` (OpenSkill, tiers, 8-week seasons, integrity), `AumMon_Game_Economy.md` (coins + gems, cosmetics only, gacha off until legal check), `AumMon_Monetization_Strategy.md` (cost model, break-even ≈ 1,000 MAU at 2 %). Prices are assumptions to re-check. Awaiting owner E1–E4.

## 2026-11-25 — 15.7 Game modes + SDK simultaneous decisions (approved M1–M3)

- `docs/platform/PLATFORM_SPEC.md`: Casual (MVP) vs Ranked (post-MVP) rules; additive SDK `pendingSeats` / `tick` / `seatCount` / optional `bot`, one deadline per phase, per-seat timeout defaults, stale-version locks; BLUFF module sketch; tests. Awaiting owner M1–M3.

## 2026-11-25 — 15.6 Guest-first architecture + account linking (approved G1–G3, L1–L2)

- `docs/platform/PLATFORM_SPEC.md`: Supabase anonymous sign-in, `private.is_guest()` + restrictive account-only policies, `requireAccount()`, nickname snapshot, abuse limits, 30-day guest cleanup, tests.
- `docs/platform/PLATFORM_SPEC.md`: same-id conversion (`updateUser` e-mail → password), `email_exists` = sign in without merge (Q4). Awaiting owner G1–G3, L1–L2.

## 2026-11-25 — 15.9 Content management design + BLUFF draft pack (approved C1–C4)

- `docs/games/bluff/SPEC.md`: `private.content_items` schema (versioned, history, per-round `content_id` + version), selection rules, draft → in_review → approved → retired flow, roles, player reports, writing guide.
- `docs/games/bluff/content/bluff_th_v1.json`: 150 Thai items (10 categories × 15, humor 1–2, 3 `group`), all `draft` → owner review C1–C4.

## 2026-11-25 — 15.4 BLUFF player-count balance approved (owner)

- `docs/games/bluff/SPEC.md` + `scripts/bluff-sim.mjs` (variants × listener trust, 2p head-to-head, tie-break applied).
- 2p claim points dominate (bluff or honest up to 72 % vs silent) → propose ruleset "2": no Bluff / Honest points in 2p. 3–8 healthy; silent path = wagering; silent bonus rejected. Owner approved P1–P2; BLUFF ruleset "2".
