# AumMon — Product Spec (v2: Guest-First Social Party Gaming)

> Version 15.0 · approved by the owner 2026-11-25 (Product Direction v2, decisions V1–V10, Q1–Q8 defaults). Replaces the "Casual Discard Edition" spec v14 as the product definition.
> Architecture, database and security: `aummon_project_blueprint.md` (v2 impact: `docs/v2/AumMon_Product_Direction_Audit.md` §3).

## 1. Platform decisions (LOCKED)

- **AumMon** — Text-Driven Social Party Gaming Platform. Tagline: _Say Less. Bluff More. Troll Your Friends._
- Web, mobile first, Thai first. 2–8 players per room; each game declares its own min / max.
- **Guest-first:** play without sign-up (Supabase anonymous session); optional account keeps the same user id.
- **Modes:** Casual (private rooms, custom rules, no rating) · Ranked (standard rules, matchmaking, seasons; account only — post-MVP).
- Server-authoritative; clients send intent only; hidden choices stay server-side until reveal.
- Free-to-play; cosmetics / convenience only; no pay-to-win, no real-money wagering. Nothing paid before a legal check and owner approval.

## 2. Product documents

| Topic | Document |
| --- | --- |
| Brand architecture | [`docs/v2/AumMon_Brand_Architecture.md`](./docs/v2/AumMon_Brand_Architecture.md) |
| Vision | [`docs/v2/AumMon_Product_Vision.md`](./docs/v2/AumMon_Product_Vision.md) |
| Strategy | [`docs/v2/AumMon_Product_Strategy.md`](./docs/v2/AumMon_Product_Strategy.md) |
| MVP requirements (acceptance criteria) | [`docs/v2/AumMon_Product_Requirements.md`](./docs/v2/AumMon_Product_Requirements.md) |
| Game modules (retired / deferred / new) | [`docs/v2/AumMon_Game_Module_Compatibility.md`](./docs/v2/AumMon_Game_Module_Compatibility.md) |
| Audit, open questions, roadmap | [`docs/v2/AumMon_Product_Direction_Audit.md`](./docs/v2/AumMon_Product_Direction_Audit.md) |
| Flagship BLUFF rules | Phase 3 (`docs/v2/AumMon_Flagship_Game_Bluff.md`, approved, ruleset "2" — 15.4 player-count tuning) |

## 3. Games

| Game | Status | Rules |
| --- | --- | --- |
| BLUFF | flagship, in design (Phase 3) | — |
| EDO Battle | deferred, playable on Dev (ruleset `"13"`) | [`docs/discard/`](./docs/discard/) (locked) |
| Dummy, Poker | retired 2026-11-25 | [`docs/archive/games/`](./docs/archive/games/) |

Any change that affects a game's results needs owner approval and a new `ruleset_version`.
