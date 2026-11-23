# AumMon — Development Changelog

Newest first. Significant changes only.

## 2026-11-23 — 14.12 Dummy ruleset "4" + pick fix (owner)

- ทิ้งโง่ now only when the next player picks just the previous discard, melds it and knocks in that turn (−50 / speto −100). Engine 10.0.0; migration `20261123000400`.
- Pick-from-pile bug: hand cards selected for sorting stayed in the selection and broke the meld (`invalid_meld`); selections are now filtered to usable cards, and cards above the chosen pile card can join the meld.
- Hand: press-and-hold then slide to reorder (◀ ▶ removed).

## 2026-11-23 — 14.11 Dummy ruleset "3" (owner)

- ทิ้งเต็ม: a discard completing a set/run with any two pile cards costs 50 (speto 100); skipped on the knock card. Engine 9.0.0; migration `20261123000300` ends active ruleset "2" games, `current_ruleset = '3'`.
- Draw by tapping the stock pile (button removed); ทิ้งเต็ม notice and rules text.

## 2026-11-23 — 14.10 Dummy ruleset "2" (owner)

- ทิ้งโง่: a discard picked by another player before the discarder's next turn costs 50 (speto 100); state tracks who discarded each pile card and when. Engine 8.0.0; migration `20261123000200` ends active ruleset "1" Dummy games and sets `games.current_ruleset = '2'`.
- UI: "น็อค!" button when one card is left; hand sorting (ตามดอก / ตามแต้ม / move ◀ ▶); ทิ้งโง่ notice; rules text updated.

## 2026-11-23 — Owner decisions + settings home button

- 12.8: best-of-3 for 2–3 players = no (single round + rematch). 14.3/14.5: Dummy / Poker basic defaults (ruleset "1") approved as-is.
- ⚙️ ตั้งค่า now on every page except running tables, with 🏠 หน้าหลัก; ← ย้อนกลับ moved to the right side of the header.

## 2026-11-23 — Settings menu, Dummy/Poker rules, back button (owner)

- Home ⚙️ ตั้งค่า now holds โปรไฟล์ + ออกจากระบบ (removed from the header).
- 📖 กติกา popup for Dummy and Poker on the home cards and on their tables (`src/games/GameRules.tsx`, from `docs/games/*/…_RULES.md` ruleset "1").
- ← ย้อนกลับ in the header on every page except home and running tables (they keep ออกจากเกม).
- Tests: route tests for rules/back; jsdom `<dialog>` stub in test setup; E2E signed-in check uses "Solo vs Bot".

## 2026-11-23 — Token-efficiency tooling

- `pnpm check:quiet` (failures only), changelog archived to `docs/archive/`, rules trimmed; replies end with a suggested next command.

## 2026-11-23 — Home settings button in the header (owner)

- ⚙️ ตั้งค่า (sound / music) moved from the home page buttons to the top bar next to โปรไฟล์ / ออกจากระบบ (home page only; game tables keep their own settings button).

## 2026-11-23 — Game Center deployed to Dev

- PR #106 merged (CI green: unit, pgTAP, backend, E2E). Migrations `20261123000000` + `20261123000100` applied to AumMon-Dev with history (existing 16 EDO matches kept as `edo_battle`); 14 Edge Functions deployed; playtest URL shows the Game Center.
- `engine-health` reports every game's ruleset; `scripts/smoke.mjs` fixed (expected the retired ruleset "2") — 8/8 checks pass on Dev.
- Load test (GC8.2) on Dev, 20 solo players: 20/20 finished, 0 errors; client-side p50 / p95 — create 3.7 / 3.8 s, view 2.5 / 3.2 s, command 0.63 / 3.4 s (with `FUNCTION_REGION=ap-northeast-1`; without it functions run far from the Tokyo DB, as found in 7.6).

## 2026-11-23 — 14.7 / 14.8 Central admin + security review

- Admin: new section **เกม** (list games with live counts, enable / disable — audited), game shown in rooms and matches lists (`gameId` filter), bot simulation for any game (shows wins per seat), phase / mode labels updated for all games.
- `docs/SECURITY_REVIEW.md` Game Center update (no new high / medium findings). Scoped admin roles (GC7.3) wait for an owner decision; load test per game (GC8.2) runs against Dev after deployment.

## 2026-11-23 — 14.3–14.6 Dummy + Poker + Quick Match

- Engines (pure, seeded): `dummy/` (Thai Dummy ruleset "1": melds, discard pickup with immediate meld, head card, speto, knock, scoring; greedy bot from its own view) and `poker/` (No-Limit Hold'em ruleset "1": 7-card evaluator, blinds, min-raise / incomplete all-in rule, side pots, showdown, sit-and-go; bot from its own view). Rules: `docs/games/{dummy,poker}/`.
- Server: both games run through the platform orchestrator unchanged; `matchmaking` function + `private.matchmaking_queue` (Quick Match, bot fill after 30 s); per-game `player_game_stats` (EDO history backfilled); lobby uses private `room:{id}` channel. Migration `20261123000100_game_center_play.sql`.
- UI: shared `useMatch` / `MatchShell` / `PlayingCard`, Dummy and Poker tables, Quick Match on every game's Online page, generic solo / online pages, profile stats.
- Decisions: GC2.8 sweeper not needed (client polling drives timers); GC6.2 wallet not needed (chips live only inside a match).
- Tests: poker (27) + dummy (19) engine incl. chip / 52-card conservation simulations, backend `game-center.test.ts`, E2E `game-center.spec.ts`, pgTAP `014`.

## 2026-11-23 — 14.1 / 14.2 Game Center foundation (GC1.1–GC2.4)

- Engine: `sdk/` Game Module Interface + generic bot/timer flow (`sdk.advance`, moved from `_shared/game-flow.ts` without behaviour change), `edo-battle/` adapter over `discard` (rules untouched), `registry.ts`. Golden replay test (21 seeded games) locks EDO Battle behaviour.
- Server: `_shared/game.ts` is a game-agnostic orchestrator choosing the module from `matches.game_id`; EDO telemetry moved to `_shared/games/edo-battle.ts`; `game-create` / `rooms-create` accept optional `gameId`; game commands parsed by the game module.
- DB `20261123000000_game_center_registry.sql`: `public.games` (RLS: enabled rows), `game_id` on rooms/matches (default `edo_battle`), per-game ruleset/phase checks, room mode `quick_match`. pgTAP `013_games`.
- UI: Game Center hub (EDO Battle + Dummy/Poker "เร็ว ๆ นี้"), public name "EDO Battle" (G1–G3), solo page shows the real 60 s turn (was "45").
- Architecture tests: no cross-game imports; every Edge Function authenticates.

## 2026-11-23 — 14.0 Game Center audit + architecture

- `docs/architecture/*` (audit, inventory, master architecture, DB plan, migration plan, risks) and `docs/roadmap/GAME_CENTER_ROADMAP.md`. Owner approved G1–G3 and GC0–GC8.

## 2026-11-22 — 12.7 VIP + cosmetic gacha design doc

- `docs/discard/AumMon_VIP_Cosmetics_Design.md`: cosmetic-only VIP (host 5–8 seat rooms) and items, coins/gems, optional gacha with published odds + pity, minors/legal checklist, `private`-schema data sketch. Nothing built; owner Q1–Q5 + legal check before any build (DC7, F8).

## 2026-11-22 — 12.21 Ruleset "13": Glue G2 (owner)

- Engine 7.0.0 / ruleset "13": กาวน้ำ gives 1 card from your hand to a chosen player (`card_given` event); play dialog asks for the player and the card; the bot gives its lowest card to the opponent with the fewest cards; the tutorial step uses it. Migration `20261122000900_ruleset13_glue.sql`. DC15.
- Simulation on the shipped engine: Glue 0.90–1.02 win index (was 0.77–0.81); 8 players 90 % of rounds ≤ 10 min.

## 2026-11-22 — 12.20 Ruleset "12": card changes + loading spinners (owner)

- Engine 6.0.0 / ruleset "12": ไฟฉาย = see one opponent's whole hand (private `peek`, no draw); แว่นขยาย = see the top 2 draw-pile cards (private, `target: null`); พัดลม = reverse only; นาฬิกาปลุก = fewest-cards player draws 1; the Flashlight "reveal all" popup is removed; private views show cards with ability text (tap to enlarge). กุญแจ art 🔑 → 🔒. Migration `20261122000800_ruleset12_cards.sql`. DC14.
- Spinner on buttons while their request runs: `StickerButton` (automatic for the clicked button), draw / keep and rematch buttons.
- Glue: proposals G1–G3; G2 "give 1 card to a chosen player" simulated (Glue 0.77–0.81 → 0.93–1.01). Waiting for the owner (12.21).

## 2026-11-22 — 12.19 Online playtest fixes (owner)

- **Bug:** after a player's command the server kept the old deadline when the turn passed to another human, so the next player got only the remaining time. Now `deadlineAfterAct` starts a fresh 60 s timer for every new turn / reaction (kept only while the same player decides on a drawn card). Integration test added.
- Flashlight reveal: no auto-close; each player's cards are shown as cards with their ability (tap to enlarge); close with ✕.
- Online next round: when a round ends the room goes back to the lobby; non-owners become "not ready"; the lobby shows "ผู้เล่นในห้อง x/y" and why the owner cannot start yet; the result screen offers "กลับห้อง (เล่นอีกรอบ)" and "ออกจากห้อง" (frees the seat). `game-rematch` stays for Solo only. DC13.

## 2026-11-22 — 12.18 Ruleset "11": 60 s turns, 7 / 5 starting cards (owner)

- Owner: turn timer 20 s → 60 s; more starting cards because rounds ended too fast. Simulation compared 5/4, 6/4, 6/5 and 7/5 with 60 s; chose **7 (2–4 players) / 5 (5–8)** (4 players est. median 3.4 → 5.0 min, 8 players 4.2 → 5.8 min; 83–93 % of rounds still ≤ 10 min).
- Engine 5.0.0 / ruleset "11"; migration `20261122000700_ruleset11_hands_timer.sql`; rules text, Core Rules, DC12, spec v12.0.

## 2026-11-22 — 12.17 Ruleset "10": Magnifier and Box (decision delegated by the owner)

- Engine 4.0.0 / ruleset "10": แว่นขยาย = peek 2 cards, then optionally play 1 more card (points rule); กล่องกระดาษ = optionally put 1 card of 1–3 points on the pile (no ability). Bot choices and play dialog (target + optional card, Box shows only 1–3 point cards). Migration `20261122000600_ruleset10_magnifier_box.sql`. DC11, Card Library, spec v11.0.
- Simulation (2,000 rounds per size): Magnifier 0.84–0.92 and Box 0.88–0.96 win index (both were the weakest cards); 8 players mean 38 turns, 86 % of rounds ≤ 10 min (model).

## 2026-11-22 — 12.16 Playtest telemetry (owner Q3)

- Migration `20261122000500_round_stats.sql`: `private.round_stats` (one row per match; never exposed; card ids only, no names / user ids). Server writes it at match start, on each human action (decision time, drawn-card plays), on every save (turns, timeouts, abilities, winner), on rematch and on leaving.
- admin-api `stats` + admin section "สถิติเล่นทดสอบ": rounds per player count, median minutes, % over 15 min, timeouts per player per round, rematch %, average decision time, leavers, card win index — the Playtest Protocol §4 measures. Tests: admin backend, pgTAP access matrix.

## 2026-11-22 — 12.15 Quality UI (owner Q3)

- Interactive tutorial `/tutorial` (`src/features/tutorial/TutorialPage.tsx`): 7 scripted situations on the real engine run locally (play, draw, Draw Then Play, ability, target, pile reset, win); home "ฝึกเล่น (1 นาที)" glows until finished once. E2E `tests/e2e/tutorial.spec.ts` + a11y.
- Cards: one-line `short` text in engine card data (display only) on hand cards, full text in the preview; Glue text "ห้ามลงแต้ม 1–3"; Hourglass dialog shows the ability it will repeat; "เหลือ 1 ใบ!" badge on players; 4-line rules summary on top of the rules popup.

## 2026-11-22 — 12.14 Ruleset "9" balance pack (owner approved Q1–Q4)

- Engine 3.0.0 / ruleset "9": กุญแจ 6 points, ร่ม 7 points, ถังขยะ removes 1 card without redraw (can win), ไฟฉาย reveal 3 s (UI). Migration `20261122000400_ruleset9_balance.sql` (rulesets 7–9, default 9; active ruleset 8 matches ended). Docs: Card Library, Core Rules, DC10, spec v10.0.
- Q2 simulation: Magnifier "peek + play 1 more" → Magnifier 0.75 → 0.89 win index (recommend); Box "put 1 card on the pile" overshoots at 6–8 players (1.28) — owner decision in 12.17.

_Older entries: `docs/archive/DEVELOPMENT_CHANGELOG_ARCHIVE.md`._
