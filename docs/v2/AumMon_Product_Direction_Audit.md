# AumMon — Product Direction v2 Audit (Phase 1)

> Status: **for owner review**. Written 2026-11-25 from the repository at `main` `1fe947c`. Nothing has been implemented, migrated, deleted or moved.
> Product Direction v2: "Guest-First, Text-Driven Social Party Gaming Platform" — tagline _"Say Less. Bluff More. Troll Your Friends."_ — flagship game **BLUFF**, 2–8 players.

## 1. Decisions

### 1.1 Approved by the owner (2026-11-25)

| ID  | Decision                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------ |
| V1  | Product identity, category and tagline as in the v2 brief §1.1.                                                          |
| V2  | 2–8 players per room; every game module declares its own min / max; 2, 3–4 and 5–8 players are designed separately.      |
| V3  | Guest-first: nickname → create / join → play → results → share, with no sign-up. Accounts are optional (permanent data). |
| V4  | Two modes: **Casual** (private rooms, custom rules, no rating) and **Ranked** (standard rules, matchmaking, seasons).    |
| V5  | Flagship game **BLUFF**, ~5 rounds, 5–10 min; server-authoritative scoring; no real-money wagering.                      |
| V6  | XP / Level separate from Rank; no gameplay power from XP, level or purchases.                                            |
| V7  | Free-to-play + cosmetics + convenience; no pay-to-win; guests may join VIP rooms free.                                   |
| V8  | Keep the current stack (Supabase, Vercel, GitHub workflow, server authority, module architecture).                       |
| V9  | **Dummy and Poker are removed** ("เอาเกมดัมมี่และโป๊กเกอร์เดิมออกไปเลย") — executed only after this audit is approved.         |
| V10 | The site's game spec becomes the v2 product (spec rewritten in Phase 2).                                                 |

### 1.2 Proposed (need approval)

| ID  | Proposal                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1  | Guests = **Supabase Anonymous Sign-ins** (real `auth.users` row, JWT, `is_anonymous`). Linking = `linkIdentity` / `updateUser({email})` keeps the **same user id**, so XP, history and inventory never move. |
| P2  | EDO Battle: **defer** (hidden from the home page, code and data kept) until BLUFF MVP ships; then decide keep / retire.                                                                                      |
| P3  | Ranked is **account-only**; guests play Casual and "Ranked practice" (no stored rating). The link prompt appears when a guest opens Ranked or ends a match with XP.                                          |
| P4  | MVP = BLUFF + guest + Casual private rooms + results share + content table + admin content review. Ranked, XP, shop, payments = post-MVP.                                                                    |
| P5  | UI v2 = Minimal Dark + playful type as a new token theme in the existing `am-*` system (`docs/color_design_system.md`), not a new CSS stack.                                                                 |
| P6  | Tagline stays English; UI and content Thai-first with `locale` on every content item (English later).                                                                                                        |

## 2. Repository audit (what exists today)

| Area            | Current state                                                                                                                                        | Evidence                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Stack           | pnpm, React 19 + Vite + TS strict, Tailwind v4 `am-*` tokens, Supabase (Auth, Postgres, Edge Functions, Realtime), Vercel, Vitest, Playwright, pgTAP | `aummon_project_blueprint.md` §1                                   |
| Games           | EDO Battle (ruleset 13), Dummy (ruleset 5), Poker (ruleset 1) behind one Game Module Interface                                                       | `packages/game-engine/src/{edo-battle,dummy,poker}`, `registry.ts` |
| Module SDK      | `GameModule`: start / apply / view / bot / timeouts / publicEvent / privateEvents / result; **one acting seat at a time**                            | `packages/game-engine/src/sdk/module.ts`                           |
| Server          | 14 Edge Functions; generic orchestrator (bots, timers, AFK auto-play, idempotency, row locks, rematch); rooms, join codes, quick match               | `supabase/functions/_shared/game.ts`, `lobby.ts`, `matchmaking.ts` |
| Identity        | Email + password accounts only; `enable_anonymous_sign_ins = false`; RLS keyed on `auth.uid()`                                                       | `supabase/config.toml`, migrations                                 |
| Data            | 36 append-only migrations; `public.games` registry, `player_game_stats`, private runtime / receipts / rate limits / audit log                        | `supabase/migrations/`                                             |
| Admin           | RBAC + MFA aal2 + audit log; game enable / disable; playtest stats                                                                                   | `docs/ADMIN.md`                                                    |
| Quality gates   | `pnpm check`, CI (unit, pgTAP, backend, E2E, a11y), secret guard, engine isolation test                                                              | `.github/workflows/ci.yml`                                         |
| Content         | Card text hard-coded in engine / UI; **no content tables**                                                                                           | `packages/game-engine/src/discard/cards.ts`                        |
| Progression     | Per-game win / loss stats only; **no XP, rank, season, inventory**                                                                                   | `player_game_stats`                                                |
| Payments        | None (VIP / gacha designed only, blocked on legal check, 12.7)                                                                                       | `docs/discard/AumMon_VIP_Cosmetics_Design.md`                      |
| Known test debt | `tests/backend/game.test.ts` "solo with 3 bots" fails when a bot moves first and makes seat 0 draw                                                   | changelog 2026-11-23                                               |

## 3. Impact analysis

### 3.1 Reuse as-is

- Stack, CI, secret guard, migration discipline, Dev project, Vercel previews, playtest branch.
- Server-authoritative orchestrator: idempotency keys, row-locked commands, timers, AFK auto-play, rematch, reconnection through `game-view` polling + Realtime channel.
- Rooms, join codes, ready flow, rate limits, quick-match queue (basis for Ranked matchmaking).
- Admin RBAC, MFA, audit log, game registry (`public.games`), enable / disable per game.
- Settings popup, back button, sound / music, accessibility checks.

### 3.2 Must change

| Item                | Change                                                                                                                                                                        | Size |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Module SDK          | Add **simultaneous decisions**: `pendingSeats(state)` (many seats act in one phase), one phase deadline, per-seat hidden choice, reveal step. EDO keeps the single-seat path. | M    |
| Identity            | Enable anonymous sign-ins; nickname on `profiles` for guests; CAPTCHA / rate limit on guest creation; guest expiry + cleanup job; RLS reviewed for anonymous users.           | M    |
| Account linking     | Link email to the anonymous user (same id). Conflict: email already owned → sign in to that account; guest data is **not merged** in MVP (shown as a choice, see Open Q4).    | M    |
| Content             | New `content_items` (id, category, locale, text, tags, min/max players, modes, humor level, status, review status, version) + admin review UI; engine receives content by id. | M    |
| Home / UX           | New home (nickname → create / join), dark theme, mobile-first party flow; remove Dummy / Poker cards.                                                                         | M    |
| Results share       | Share card (image or text + link) generated client-side from server results; no private data.                                                                                 | S    |
| Spec + docs         | Rewrite `aummon_game_spec.md`, blueprint, handoff, roadmap for v2.                                                                                                            | S    |
| Ranked, XP, economy | New services and tables (post-MVP).                                                                                                                                           | L    |

### 3.3 Retire (V9) — plan only, after approval

Remove from code: `packages/game-engine/src/{dummy,poker}`, `src/games/{dummy,poker}`, rules popup entries, tests, registry entries, smoke checks. Database: a forward migration sets `games.is_enabled = false` and ends active Dummy / Poker rooms and matches; **rows stay as history** (no destructive delete). Docs move to `docs/archive/games/`.

## 4. Existing game modules — compatibility

| Game       | Verdict                                      | Reason                                                                                                       |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Dummy      | **Retire** (owner V9)                        | Classic card game, not text-driven party play; 2–4 players only.                                             |
| Poker      | **Retire** (owner V9)                        | Play-money poker still carries legal / store risk; overlaps with "wager" mechanics BLUFF covers more safely. |
| EDO Battle | **Defer** (P2) — needs UX redesign to fit v2 | Works with the platform today; art not produced; not text-driven. Keep code, hide from home until decided.   |

## 5. Documents (proposed)

New folder `docs/v2/`. "Update" = existing file rewritten, no duplicate.

| #   | Document                                | Action                                                         | Phase |
| --- | --------------------------------------- | -------------------------------------------------------------- | ----- |
| 1   | AumMon_Product_Vision.md                | new                                                            | 2     |
| 2   | AumMon_Product_Strategy.md              | new                                                            | 2     |
| 3   | AumMon_Product_Requirements.md          | new (+ `aummon_game_spec.md` rewritten as index)               | 2     |
| 4   | AumMon_Game_Design_Principles.md        | new                                                            | 3     |
| 5   | AumMon_Flagship_Game_Bluff.md           | new                                                            | 3     |
| 6   | AumMon_Player_Count_Design.md           | new                                                            | 4     |
| 7   | AumMon_Guest_First_Architecture.md      | new                                                            | 6     |
| 8   | AumMon_Account_Linking.md               | new                                                            | 6     |
| 9   | AumMon_Game_Modes.md                    | new                                                            | 7     |
| 10  | AumMon_Level_XP_Design.md               | new                                                            | 8     |
| 11  | AumMon_Rank_System.md                   | new                                                            | 8     |
| 12  | AumMon_Game_Economy.md                  | update from `docs/discard/AumMon_VIP_Cosmetics_Design.md`      | 8     |
| 13  | AumMon_Monetization_Strategy.md         | new (cost model)                                               | 8     |
| 14  | AumMon_UI_UX_Guidelines.md              | update from `docs/color_design_system.md` (dark theme added)   | 5     |
| 15  | AumMon_Content_Management.md            | new                                                            | 9     |
| 16  | AumMon_Technical_Architecture_Impact.md | update `docs/architecture/MASTER_ARCHITECTURE.md` (v2 section) | 10    |
| 17  | AumMon_Game_Module_Compatibility.md     | from §4 of this audit                                          | 2     |
| 18  | AumMon_Test_Strategy.md                 | update blueprint §6 + brief §12 cases                          | 10    |
| 19  | AumMon_Migration_Roadmap.md             | update `docs/DEVELOPMENT_ROADMAP.md` (new Phase 15+)           | 2     |
| 20  | AumMon_Master_Project_Handoff.md        | update `docs/AumMon_Master_Handoff.md`                         | 2     |

## 6. MVP scope (proposal P4)

**MVP (Closed Playtest):** guest nickname + anonymous session + reconnect · Casual private room (2–8, join code / link) · BLUFF with 2, 3–4 and 5–8 variants, 5 rounds, server scoring, timers, AFK / disconnect rules · ~150 reviewed Thai content items · results screen + share · optional email link (same id) · admin content review · dark mobile UI · Dummy / Poker retired, EDO hidden.

**Post-MVP:** Ranked (rating, placement, tiers, seasons, anti-boost), XP / levels / missions / achievements, collection, shop, VIP host, payments, leaderboard, English locale, more games.

## 7. Roadmap and dependencies

| Phase | Name                         | Depends on | Output / gate                                                    |
| ----- | ---------------------------- | ---------- | ---------------------------------------------------------------- |
| 1     | Repository Audit             | —          | this document → **owner approval**                               |
| 2     | Product Direction & Reqs     | 1          | docs 1–3, 17, 19, 20; spec rewritten; Dummy / Poker retired      |
| 3     | BLUFF Game Design            | 2          | docs 4–5; scoring model + simulation → **owner approval**        |
| 4     | 2–8 Player Balance           | 3          | doc 6; engine simulation per player count                        |
| 5     | UI/UX Prototype              | 3          | doc 14; clickable prototype on Vercel preview → **owner review** |
| 6     | Guest-First Architecture     | 2          | docs 7–8; anonymous auth + RLS design → **owner approval**       |
| 7     | Casual & Ranked Architecture | 6          | doc 9; SDK simultaneous-decision design                          |
| 8     | XP & Rank Design             | 7          | docs 10–13 (design only, built post-MVP)                         |
| 9     | Content Management           | 3          | doc 15; content schema + review flow                             |
| 10    | Technical Migration Plan     | 4–9        | docs 16, 18; migration list → **owner approval**                 |
| 11    | MVP Implementation           | 10         | engine, functions, migrations, UI; CI green; Dev deploy          |
| 12    | Closed Playtest              | 11         | real phones, 2 / 4 / 8 players; telemetry                        |
| 13    | Balance & UX Iteration       | 12         | ruleset bumps as needed                                          |
| 14    | Launch Preparation           | 13         | production project (6.8), legal, payments decision (7.8)         |

Phases 3, 5, 6 and 9 can run in parallel after Phase 2.

## 8. Cost assumptions (to verify before Phase 8 — public prices change)

| Item     | Dev / playtest         | Small launch (assumption: ≤ 5k MAU, ≤ 200 concurrent)      |
| -------- | ---------------------- | ---------------------------------------------------------- |
| Supabase | Free (current)         | Pro ≈ US$25 / month + usage                                |
| Vercel   | Hobby (non-commercial) | Pro ≈ US$20 / member / month (required for commercial use) |
| Realtime | Free tier limits       | included in Supabase Pro quota                             |
| Payments | —                      | provider fee ≈ 3–4 % + fixed per transaction               |

## 9. Open questions (owner)

| #   | Question                                                                                        | Default if not answered                                      |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Q1  | EDO Battle: defer (hidden, kept) or retire too?                                                 | defer (P2)                                                   |
| Q2  | Guests via Supabase Anonymous Sign-ins (P1)?                                                    | yes                                                          |
| Q3  | Ranked account-only (P3)?                                                                       | yes                                                          |
| Q4  | Email already has an account when a guest links: keep guest data separate (MVP) or merge later? | separate, sign in to the account                             |
| Q5  | Content language at launch: Thai only?                                                          | Thai only                                                    |
| Q6  | Who writes the first ~150 BLUFF scenarios: Claude drafts, owner reviews?                        | yes                                                          |
| Q7  | Bots in BLUFF (to fill 2-player or small rooms)?                                                | ~~no bots~~ → owner 2026-11-25: medium bots fill empty seats |
| Q8  | Art pipeline (Phase 13 of the old roadmap) paused since v2 is text-driven?                      | pause                                                        |

## 10. Assumptions

- "Remove Dummy / Poker" means remove from product and code, keeping database rows as history.
- BLUFF content can be humorous but must never target real private individuals; group-directed prompts ("ใครในห้องนี้…") are moderated by humor level and tags.
- Existing registered accounts stay valid and become "Registered" players in v2.
- No production deploy or paid service is enabled without separate owner approval.
