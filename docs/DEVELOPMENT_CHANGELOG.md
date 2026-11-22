# AumMon — Development Changelog

Newest first. Significant changes only.

## 2026-11-22 — 12.2 Discard Edition engine + simulation

- `packages/game-engine/src/discard` (exported as `discard`, ruleset "7"): 16 data-driven cards × 4, deal 7 / 5, ≥-top play rule, Eraser wild, pile reset after everyone passes, Glue / Ruler restrictions, Umbrella reactions queued per target, Hourglass loop guard, private Magnifier peek event, seat views, normal bot. 12 tests incl. 280 bot games over 2–8 players with card conservation.
- Simulation (2,000 games × 7 sizes): 100 % of games finish; first player +3–5 points; card win rates 21–32 % (fair 25 %) — `docs/discard/AumMon_Card_Balance.md` (tweaks proposed, not applied).

## 2026-11-22 — 12.1 New game direction: Casual Discard Edition (audit + rules)

- Owner brief: shed-your-hand game for 2–8 players with 16 Everyday Objects. Phase 1 audit (`docs/discard/AumMon_Rule_Clarification.md`): the base "≥ top or draw & pass" rule stalls (simulation: 0.1–5 % of games finish); pile reset fixes it (~100 %). Owner decisions DC1–DC7: pile reset, 64-card deck, Umbrella reaction, Magnet / Hourglass redesign, Eraser wild, remove the 1v1 TCG after the switch and keep 3 modes, VIP / gacha designed now and built later. `AumMon_Core_Rules.md`, `AumMon_Card_Library.md`. Phase 12 roadmap.

## 2026-11-22 — 11.9 Link tap sounds + louder music (owner report)

- React Router links call `preventDefault()`, which the tap-sound listener treated as "cancelled"; it now plays for them too (drags still stop the click first). Music volume 0.05 → 0.1. Verified in a browser: the Solo link plays its tap sound.

## 2026-11-22 — 11.8 Card counts in rules, sounds everywhere, background music (owner request)

- Rules popup lists card counts. Tap sounds + audio unlock moved to `AppLayout` (every button / link on every page). `music.ts`: synthesized I–vi–IV–V loop via Web Audio (no files), on by default, starts on the first tap; `AudioSettings` (effects + music switches, remembered per browser) in the new home ⚙️ popup and the in-game settings.

## 2026-11-22 — 11.7 First-player balance (ruleset 6)

- Simulated (8,000 bot games each): today 70 % first-player wins; "no attack on turn 1" alone ≈ 70 % (new Objects sleep anyway); + extra card 67 %; + 1 SPARK 54 %; all together 51 %. Owner chose all three. Engine `rules/v6` (0.6.0), mulligan accepts 6 cards, migration `20261122000000_ruleset6.sql`, spec v7.0, R5 closed. Repo is now public (unlimited CI).

## 2026-11-21 — 11.6 Save Actions minutes

- GitHub warned 90 % of the 2,000 free Actions minutes were used (resets 2026-12-01). CI now runs once per PR (the duplicate run on `main` after each squash merge is gone) and skips docs-only changes. Owner asked to set the Actions budget to $0 so nothing is ever charged.

## 2026-11-21 — 11.5 Balance pass (owner request)

- Measured with 8,000 bot-vs-bot games (win rate when the card was drawn); range 38–56 % → 47–54 %. Exhaust-enemy actives were useless under ruleset 5 (enemies wake at their own turn start) and were redesigned (Door heals the player, Alarm Clock wakes a sleeping ally, Power Strip +2 ATK to another electronic). Strong cards toned down (Bottle Rocket, Vacuum, Cooler, Wooden Door), weak ones made cheaper / sturdier. Card data only (owner precedent for in-playtest card changes: ruleset stays "5"); migration `20261121000500_balance_pass.sql`; spec v6.1. Bot now uses self-targeted max-HP actives.
- Open: first player wins ~68 % in simulation — needs a core-rule decision (R5).

## 2026-11-21 — 11.4 Rules update from the owner (ruleset 5)

- Owner wrote the new rules; clarified with the owner: Active does not put the Object to sleep, Guard must be attacked first (awake or asleep), Guard and Flying never combine, bump to ruleset "5".
- Engine `rules/v5` (engine 0.5.0): no Main → Battle lock (summon / activate after attacking), Active allowed while asleep and only once per turn, Guard forcing ignores sleep, Helmet cannot give Guard to a flying ally, validator rejects Guard + Flying cards. Migration `20261121000400_ruleset5.sql` (rows in place, `starter_v5`, unfinished ruleset 4 matches abandoned). Rules popup uses the owner's wording; spec v6.0; R4 recorded.

## 2026-11-21 — 11.3 Sort by SPARK cost (owner request)

- Hand and "All cards" gallery ordered cheapest first (`sort.ts`; ties: playable first, then card id). Replaces the playable-first-only hand order.

## 2026-11-21 — 11.2 Category rework (owner request)

- CONTAINER label "ที่เก็บของ"; HOUSEHOLD replaced by FREE "อิสระ" (Objects in no other category: Umbrella, Helmet, Wooden Door, Bottle Rocket); Bottle Rocket no longer VEHICLE (affects Bicycle bonus / Toy Truck search); Vacuum ELECTRONIC only. Owner chose to keep `ruleset_version` "4" for this playtest-stage change. Migration `20261121000300_trait_rework.sql` updates the card rows; spec v5.1.

## 2026-11-21 — 11.1 Free Actives (ruleset 4) + card gallery (owner request)

- Owner decisions: Active abilities cost no SPARK (other Active rules unchanged); strong cards cost more to summon (O02, O03, O05, O06, O12, O13, O14, O17, O20, O21, O24 with stats kept inside the power budget); Toy Racer's Turbo keeps the car ready to attack and puts it to sleep at end of turn; `ruleset_version` 3 → 4 (engine folder `rules/v4`, migration `20261121000200_ruleset4.sql`, unfinished ruleset 3 matches abandoned); Game Spec v5.0.
- UI: "เหนื่อย" → "หลับ 💤" everywhere (cards, rules, card texts); category names in Thai (card frame + texts); 🗂️ "การ์ดทั้งหมด" gallery with category filter and card details — on the home page and in the game top bar (where 📜 was); 📜 history moved into ⚙️ settings.

## 2026-11-21 — 10.5 Ruleset 2 removed · Game Spec v4.0

- `aummon_game_spec.md` v4.0 is the single rule source (Object Cards, Passive/Active rules, 4 keywords, 24 cards, Starter Deck v3); the temporary framework doc merged into it and deleted.
- Removed `rules/v2` engine + tests, ruleset 2 seed rows and drift test; migration `20261121000100_drop_ruleset2_recipes.sql` drops the Evolution/Fusion recipe tables. Ruleset 2 card/deck rows on Dev stay (inactive) because finished matches reference them — history kept.
- pgTAP: ruleset 3 catalog test replaces the ruleset 2 one. Blueprint, README and domain rules point to ruleset "3".

## 2026-11-21 — 10.3 + 10.4 Ruleset 3 live: server + UI (shipped together)

- Migration `20261121000000_ruleset3.sql`: ruleset "3" allowed for cards / decks / rooms, 24 Object rows (abilities in `effect_spec`), `starter_v3`; ruleset 2 retired on the server (unfinished matches abandoned, rooms closed, `starter_v2` inactive — owner approved). Drift test `tests/architecture/seed-v3.test.ts`.
- Edge Functions (`tcg-*`, lobby, account-delete, admin-api) run ruleset 3; `tcg-command` accepts `activate` (instance + optional target) and drops Action/Equipment/Evolution/Fusion/Boost commands. `RULESET_VERSION = "3"`.
- UI: card frame with placeholder Living-Objects art (emoji), 🔁 Passive / ✨ Active lines, effective stats with static auras; tap any Object (own or opponent) for an info popup; command popup shows the full card + ability targets; drag & drop summons; rules text rewritten; sounds `ability` / `passive` replace evolve / fuse / equip / action / boost; admin card list shows abilities.

## 2026-11-21 — 10.2 Engine ruleset 3 (Everyday Objects)

- `packages/game-engine/src/rules/v3` (exported as `v3`, engine 0.3.0): 24 Object cards, Starter Deck v3, Passive (static auras / triggered on_summon, on_attack, on_destroyed, on_turn_start, on_turn_end) + Active (`activate` command: Main Phase, Ready, SPARK, exhaust unless no-exhaust, once per turn, targets validated before paying), 9 effect types, 3 durations, trigger queue (active player first, by slot), destroy-until-stable state checks, 100-effects-per-command loop guard, card data validator, normal bot.
- Tests: every handoff §10.2 case, card set distribution + budget, 1,000 random matches, 200 bot-vs-bot, bot beats random ≥ 80 %, determinism, hidden information. Ruleset 2 untouched (server still uses it until 10.3).

## 2026-11-21 — 10.1 New direction: Everyday Objects Battle (owner approved)

- Audit of the new direction brief vs repository; owner approved all recommendations (D1–D11, `docs/rule-clarifications.md` R3): Object cards only (no Action/Equipment/Field/Evolution/Fusion), ATK/HP, 1 Passive + 1 Active (Active: Main Phase, Ready, SPARK ≥1, exhausts unless "no exhaust", once per turn), keywords Haste/Guard/Flying/Piercing, traits for synergy, `ruleset_version "3"`, ruleset 2 deleted after the switch.
- `docs/design/object-ability-framework.md`: ability rules, effects, durations, safety limits, power budget, 24-card prototype set (8 Passive / 8 Active / 8 Dual, 4 archetypes), Starter Deck v3. Brief moved to `docs/design/`. Phase 10 roadmap added.

## 2026-11-21 — 9.18 Tap sounds (owner request)

- Every button on the game screen makes a sound: shared "tap" (new preset แตะเบาๆ), with separate sounds for card tap (พลิกการ์ด), hand open (เลื่อนขึ้น) and hand close (เลื่อนลง). One document-level listener (`installTapSounds`, `data-sound` overrides; chosen in capture phase, skipped when a drag cancels the click). 4 new events + 4 presets also in admin sound settings and the server schema (drift test). Owner confirmed sounds work after 9.17.

## 2026-11-21 — 9.17 Fix silent game sounds (owner report)

- Stored admin sound config on Dev checked: valid, all enabled (not the cause). Cause: sounds now play from server responses (paced bot steps, polls) outside user gestures, and browsers (iOS Safari) keep the AudioContext suspended/interrupted. `installAudioUnlock()` resumes + unlocks audio on every tap/key; `play` resumes any non-running context. Owner confirmed keeping the current Guard rule.

## 2026-11-21 — 9.16 Game screen tweaks (owner request)

- 📖 rules button moved to the top bar left of history (removed from settings popup); exhausted label now "💤 เหนื่อย"; folded hand drawer opens from a tap anywhere on it (cards included), closes from the header as before. E2E updated.
- Investigated "opponent hit face past our Guard": not a bug — spec §5.18 / R2-4, only a Ready Guard protects; a Guard that attacked stays exhausted until our next Start Phase.

## 2026-11-21 — 9.15 Paced bot, drag & drop, history order (owner request)

- **Bot pacing (server):** `tcg-flow.ts` now runs one bot action per step, `BOT_STEP_MS = 700` apart (deadline holds the next step time; bot mulligan stays instant). `tcg-view` reports `botActing`; the client refreshes at each step and shows "🤖 Bot กำลังเล่น…". Flow/backend/load tests updated for paced turns. No rule change.
- **UI:** history grouped by turn, newest turn on top (`historyByTurn` + test); hand sorts playable cards first; drag & drop via pointer events (`DraggableCard.tsx`, no dependency): drag up from the hand, unit → empty slot (green "วางที่นี่") summons, equipment → highlighted unit attaches, action → command popup; tapping still works and sideways swipes still scroll the hand.

## 2026-11-21 — 9.14 Game screen layout B (owner choice)

- Mockups of 3 layouts shared; owner chose B with A's deck chips and the end-turn button left of the player's HP. `TcgMatchPage` is now a full-screen layer: sticky top bar (turn, phase, timer, history, settings), field that fits without page scroll (compact unit frames), hand drawer at the bottom (folded = card fan, open = swipeable cards; auto-opens on your turn and for mulligan). Deck shown as a deep-purple count chip (contrast 13.65:1). Popups, commands and game flow unchanged.

## 2026-11-21 — 9.13 Color Design System (Theme A · Balanced, owner approved)

- Tokens: approved palette + semantic tokens in `src/styles/index.css` (legacy `--am-*` aliases remapped, so every page follows); global focus ring; feedback animations (damage/heal/attack, reduced-motion safe).
- Applied: home hero (deep purple + golden title), yellow Play CTAs, button variants with disabled/hover/pressed/focus states; battlefield with pink opponent / blue player areas, dashed empty slots, yellow selection + green valid-target rings; new `CardFrame` (title band, ATK/HP stat chips, SPARK cost, Evolution/Fusion stripes, exhausted label); keyword badges with icon + Thai text + color (6 incl. Draw/Search); HP pink heart, SPARK blue bolt with pips; victory/defeat panels; alerts and popups.
- Doc: `docs/color_design_system.md` (palette, mappings, contrast table, usage rules). Display only — engine, rules, schema, auth and game flow untouched.

## 2026-11-20 — 9.12 Home rules popup (owner request)

- `HomePage`: secondary pill button "📖 วิธีเล่น & กติกา" under the mode buttons (lighter than play actions, available signed out) opens the shared rules popup with a "เข้าใจแล้ว" close button. Test in `routes.test.tsx`.

## 2026-11-20 — 9.11 Admin sound settings (owner request)

- Admin "เสียง" page: for each of 11 game moments pick one of 17 synthesized sounds (ป๊อป, ฟองสบู่, เหรียญ, คลิก, ตุ๊บ, ฟันดาบ, เลเซอร์, กลอง, ระเบิด, วิบวับ, เวทมนตร์, วูช, พลังขึ้น, กระดิ่ง, ระฆัง, แฟนแฟร์, เศร้า), volume 0–200 %, on/off, ▶ preview, reset to defaults. Applies to every player.
- Migration `20261120000600_game_settings.sql` (`public.game_settings`, authenticated read-only, RLS); `admin-api` `sounds.get`/`sounds.set` (server validation in `_shared/sound-schema.ts` + drift test, audited); game loads the settings at start. Tests: pgTAP 012, backend admin, sound schema/normalization.

## 2026-11-20 — Sound volume +50% (owner request)

- `src/features/tcg/sound.ts`: master `VOLUME = 1.5` on every effect.

## 2026-11-20 — 9.9 Popup fix + sound effects (owner request)

- **Bug:** ⚙️ → กติกา/ยอมแพ้ did nothing — closing the settings dialog programmatically fired its `onClose`, which cleared the popup just opened; forfeit relied on `window.confirm` over a modal. Fix: `Popup` ignores programmatic closes; forfeit confirms inside its own popup. E2E now covers settings → rules → forfeit.
- **Sounds:** Web Audio effects (no files) for summon, attack, destroy, evolve, fuse, equip, action, boost, your turn, win/lose; 🔊/🔇 toggle in settings (remembered per browser). Files: `src/features/tcg/sound.ts` (+ test), `Popup.tsx`, `TcgMatchPage.tsx`.

## 2026-11-20 — 9.8 Game screen UI (owner request)

- Tap a card or unit → popup with only its legal commands (chosen over drag-and-drop: easier and safer on phones). Top-right 📜 history popup (moved from the bottom) and ⚙️ settings popup with กติกา (rules summary) and ยอมแพ้. HP as heart icons, energy as bolt icons with numbers, opponent hand as card backs, deck pile showing cards left. Files: `src/features/tcg/` (`TcgMatchPage`, `GameIcons`, `Popup`, `RulesText`), E2E specs.

## 2026-11-20 — 9.7 Thai card names (owner request)

- All 25 cards named in Thai (e.g. เป็ดยางจิ๋ว, ผู้พิทักษ์กระป๋อง, เป็ดยางเทอร์โบ); keywords โจมตีทันที/โล่กำบัง/บินได้/เจาะทะลุ/เร่งพลัง; card text, traits, events and buttons in Thai (game + admin). Engine `cards.ts`, `seed.sql`, migration `20261120000500_thai_card_names.sql`, spec §1.5/§1.6/§6.5.4 (English kept in brackets), clarification R2-9. Display only: IDs, stats and `ruleset_version` unchanged.

## 2026-11-20 — 9.6 Admin room cleanup (owner request)

- Rooms page: every open room can be closed (lobby or playing; an unfinished game is abandoned with no winner, history kept — rows are closed, not deleted). Server marks stale rooms with a reason: no players, expired code, game already finished, or no activity for 2 hours; "ปิดห้องที่ค้างทั้งหมด" closes them in one audited action.

## 2026-11-20 — 9.5 Admin overview tweaks (owner request)

- Overview card "กำลังล็อกอินอยู่": distinct users with an Auth session used/refreshed in the last hour (`auth.sessions`, server-side only); recent game events limited to 10.

## 2026-11-20 — 9.3–9.4 Admin live + readable dashboard

- **9.3:** owner's Dev account granted `super_admin` (audited); owner confirmed login with MFA.
- **9.4 (owner request):** every admin page in plain Thai — menu names and a one-line explanation per page, Overview as stat cards (players, open rooms, live games, games finished 24 h, system status, environment), data shown as readable cards (Thai statuses, dates, card names, event sentences) instead of database tables; new "สุขภาพระบบ" page (speed/errors/daily games). Files: `src/features/admin/` (`AdminPage`, `format.ts` + tests, `guard.ts`), `admin-api` (event payloads, audit actor names).

## 2026-11-20 — 9.1–9.2 Developer Admin

- **Files:** migration `20261120000400_admin.sql`, `supabase/functions/admin-api`, `_shared/admin.ts`, `_shared/env.ts`, `src/features/admin/` (`AdminPage`, `MfaPanel`, `guard`), `docs/ADMIN.md`, `supabase/functions/ci-dev.env`, config (local TOTP on).
- **Security:** roles only in `private` (no client access, self-grant impossible); every action checks session + role + MFA aal2 on the server; mutations audited in an append-only log; catalog read-only and public match data only (owner decisions); no service key in the client; tier from `AUMMON_ENV` (unset = production, dev tools off).
- **Tests:** pgTAP 011 (10), backend admin RBAC (7, incl. TOTP + logout), env tier, gate unit test, E2E non-admin blocked. Deployed to Dev with `AUMMON_ENV=development`.
- **Remaining:** 9.3 owner creates the Dev admin user.

## 2026-11-20 — 8.14 Ruleset 1 retired

- **Removed:** engine ruleset 1 (domain, characters, views, bots, rules/v1 + tests), Edge Functions `matches-*` (also deleted from Dev), `flow.ts`, `matches.ts`, old match page/route. Engine 0.2.0, `RULESET_VERSION = "2"`.
- **Changed:** `rooms-create` online-only; `account-delete` forfeits 1v1 matches, abandons leftover ruleset 1 matches; smoke/load/CI health check use ruleset 2.
- **Kept:** ruleset 1 tables/rows (characters, old matches) — removing data needs owner approval.
- **Verification (Dev):** smoke 8/8; E2E solo, pass & play, online on the playtest URL; load 20/20 (`tcg-command` server p50 138 ms / p95 360 ms; baseline in `docs/OPERATIONS.md`).

## 2026-11-20 — 8.13 Ruleset 2 Online

- **Files:** `_shared/lobby.ts`, `rooms-create`, `rooms-join` (online rooms are ruleset 2: 2 seats, no characters), `OnlinePage.tsx`, `LobbyPage.tsx` (start via `tcg-start`, → `/game/:id`), `TcgMatchPage.tsx` (private Realtime channel + Presence dot), tests `tests/backend/online.test.ts`, E2E `online.spec.ts`.
- **Behaviour:** hashed expiring join codes + rate limits unchanged; each browser sees only its own hand; concurrent commands serialized by the match row lock; forfeit; 90 s timer.

## 2026-11-20 — 8.12 Ruleset 2 Pass & Play

- **Files:** `PassPlaySetupPage.tsx` (2 names → `tcg-create`), `_shared/tcg.ts` (hand stays visible while the same seat keeps acting; hidden on seat change), E2E `pass-play.spec.ts`, backend test.
- **Behaviour:** privacy handoff before every seat change (mulligan and turns), no timer, nothing private rendered before reveal.

## 2026-11-20 — 8.11 Ruleset 2 board UI + Solo

- **Files:** `src/features/tcg/` (`TcgMatchPage.tsx`, `labels.ts`, `types.ts`), route `/game/:matchId`, `SoloSetupPage` (1v1 vs bot via `tcg-create`), home/footer text (Ruleset 2 · 1v1), E2E `solo.spec.ts`, `a11y.spec.ts`.
- **Behaviour:** board with both players (HP, SPARK, hand/deck counts), units with effective ATK/HP/keywords/equipment, hand with cost/stats; tap a card/unit → buttons built only from server `legal` commands; mulligan picker; 90 s countdown; event log; forfeit; Pass & Play handoff hook ready for 8.12.
- **Tests:** 3 label tests; E2E solo plays a full match (CI).

## 2026-11-20 — 8.10 Ruleset 2 backend

- **Files:** `supabase/functions/_shared/tcg.ts` (create/start, lock → advance → command → save, per-seat view), `_shared/tcg-flow.ts` (pure: bots + 90 s timer), Edge Functions `tcg-create`, `tcg-start`, `tcg-command`, `tcg-view`; migration `20261120000300_ruleset2_rooms.sql`; `tests/integration/tcg-flow.test.ts`, `tests/backend/tcg.test.ts`.
- **Behaviour:** intent-only commands (shape-validated, server picks the seat), row lock per match, expected-version check, idempotency receipts in the same transaction, engine errors → 409 codes; bots mulligan/play on the server; human turn timeout → auto end turn (mulligan: keep hand); Pass & Play has no timer and hides the hand until reveal. Ruleset 1 endpoints untouched until 8.14.
- **Tests:** 5 flow tests; 4 backend tests run in CI (local Edge Runtime cannot reach npm through the sandbox proxy).

## 2026-11-20 — 8.9 Ruleset 2 database catalog

- **Files:** `supabase/migrations/20261120000200_ruleset2_catalog.sql`, `supabase/seed.sql`, `supabase/tests/database/010_ruleset2_catalog.test.sql`, `tests/architecture/seed-v2.test.ts`.
- **Schema (additive):** `card_definitions` gains ruleset 2 columns (rarity, stage, cost, ATK/HP, traits, keywords, slots, deckable) with per-ruleset checks; `evolution_recipes`, `fusion_recipes` (RLS read-only for authenticated); `deck_templates.ruleset_version`; match phases `mulligan/main/battle`; character columns nullable on `match_players`. Match state + card instances stay in `private.match_runtime.internal_state`.
- **Seed:** 25 cards, 11 recipes, `starter_v2` deck; drift test keeps seed equal to engine data.
- **Tests:** pgTAP 12 new (10 suites pass); 27 drift checks.

## 2026-11-20 — 8.8 Ruleset 2 bot

- **Files:** `rules/v2/bot.ts` (`chooseBotCommand`), `tests/v2-bot.test.ts`.
- **Behaviour:** scores legal commands from its own `PlayerView` only: fuse > evolve > summon > equip > actions > boost; attacks take lethal, favour good trades, avoid bad ones; ties via RNG.
- **Tests:** 4 new — ≥80/100 wins vs random (seeded), bot-vs-bot always finishes, takes lethal, view-only input.

## 2026-11-20 — 8.7 Ruleset 2 simulation + acceptance

- **Files:** `tests/v2-simulation.test.ts`.
- **Tests:** 200 seeded random matches all finish (both seats win some); invariants each command (30 deck-origin cards, ≤3 units, ≤10 hand, SPARK 0–8); determinism; views leak no opponent hand/deck. Scenarios T-001–T-007 covered in 8.4–8.6.
- **Remaining:** spec §5.17 #11/#12/#15 apply once triggered effects exist.

## 2026-11-20 — 8.6 Ruleset 2 evolution + fusion

- **Files:** `rules/v2/match.ts` (`evolve`, `fuse`), `tests/v2-evolution.test.ts`.
- **Behaviour:** Evolution keeps instance + exhaustion, full HP of new form, history, compatible equipment (U004 cost −1, floor 1). Fusion consumes 2 parents + equipment to Discard, new instance with parent history, full HP, Exhausted unless Haste, recipe-only keyword inheritance.
- **Tests:** 8 new incl. spec scenarios T-006, T-007.

## 2026-11-20 — 8.5 Ruleset 2 actions + equipment

- **Files:** `rules/v2/match.ts` (`play_action`, `attach`), `stats.ts` (`canEquip`, `usedSlots`), `tests/v2-actions.test.ts`, `tests/v2-fixtures.ts`.
- **Behaviour:** Draw 2, Search (player picks, revealed, deck shuffled), Scrap Return; equipment cost, trait compatibility (Battery Buddy any), 2 slots, stat/keyword bonuses.
- **Tests:** 10 new. **Decisions (owner):** R2-7 Search choice, R2-8 no-target actions not playable.

## 2026-11-20 — 8.4 Ruleset 2 combat + keywords

- **Files:** `rules/v2/stats.ts` (effective ATK/HP/keywords incl. equipment), `match.ts` (`boost`, `attack`, Main → Battle phase), `tests/v2-combat.test.ts`.
- **Behaviour:** simultaneous unit damage, direct attack unless a Ready Guard blocks, Flying targeting, flying-Guard exception, Piercing excess, Boost +2 once/turn, destroyed units + equipment to Discard.
- **Tests:** 12 new incl. spec scenarios T-001–T-005. **Decision (owner):** R2-6 phase order.

## 2026-11-20 — 8.3 Ruleset 2 engine core

- **Files:** `packages/game-engine/src/rules/v2/` (`state.ts`, `match.ts`, `view.ts`), `tests/v2-match.test.ts`.
- **Behaviour:** seeded setup, random first player, mulligan, SPARK 1→8, Start/Main/End flow, summon (Haste ready), hand limit 10 (burn), fatigue, win/draw, forfeit, legal commands, client-safe view; state never mutated.
- **Tests:** 16 new. **Decisions (owner):** R2-2…R2-5 in `docs/rule-clarifications.md`.

## 2026-11-20 — 8.2 Ruleset 2 card data

- **Files:** `packages/game-engine/src/rules/v2/` (types, cards, recipes, constants, validate), `tests/v2-card-data.test.ts`; exported as `v2` namespace.
- **Tests:** 9 new — counts, validation clean, power budget clean, deckability, Starter Deck 30/≤3, spec stats, bad-data rejection.
- **Decisions (owner):** rarity by stage (provisional, cosmetic); English card names. U202/U203 keywords come only from Fusion inheritance.

## 2026-11-20 — Old ruleset text removed (R2-1)

- **Files:** `aummon_game_spec.md` §5.12/5.14/5.17/§11, `docs/rule-clarifications.md`
- **Decision (owner):** V1.1 rules only; removed V1.0 keyword/DEF leftovers and retired Q1–Q12 clarifications.

## 2026-11-20 — 8.1 Spec v3.0: 1v1 TCG consolidation

- **Files:** `aummon_game_spec.md` (v3.0, single spec), `aummon_project_blueprint.md` (v1.2), roadmap Phase 8, `docs/rule-clarifications.md` (C1 resolved, R2-1), `.claude/rules/*`, `CLAUDE.md`, `README.md`; removed `AumMon_Master_Project_Handoff.md` (merged).
- **Decisions (owner):** 1v1 TCG replaces 2–4 player game (`ruleset_version = "2"`); keep auth/menus/platform; Solo + Pass & Play + Online as 1v1; provisional Starter Deck 30 cards; 90 s turn timer → auto end turn.
- **Remaining:** R2-1 (V1.0 leftovers in spec §5.12/5.14/5.17) needs confirmation before 8.4; game code still ruleset 1 until Phase 8.

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
