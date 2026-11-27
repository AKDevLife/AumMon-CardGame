# AumMon — Master Brand Architecture (v1.0 draft, owner 2026-11-27)

> Source: owner message 2026-11-27. AumMon is the master brand and multi-game party platform, not a single game.

## 1. Brand structure

| Level           | Name                                                           |
| --------------- | -------------------------------------------------------------- |
| Master brand    | AumMon                                                         |
| Platform        | AumMon Party Game Platform                                     |
| Game collection | AumMon Games                                                   |
| Categories      | Social Party Games · Card Games · future categories            |
| Games           | AumMon BLUFF · AumMon Object Battle Card · future game modules |

## 2. Platform principle (maps to the current architecture)

- All games share platform services: guest / account identity, rooms + join codes, server-authoritative match orchestrator (SDK, timers, bots), content management, admin, telemetry.
- Each game keeps its own rules, engine module (`packages/game-engine/src/<game>`), ruleset version and content.
- A new game = new engine module + registry row (`public.games`) + client entry (`src/platform/games.ts`) + UI; no brand or platform redesign (Game Center registry, 14.x / 15.x).

## 3. Intellectual property (owner actions, outside the codebase)

- Trademark protection for **AumMon** first; evaluate the logo; evaluate each game name separately.
- Keep ownership / licensing records for source code, game content (e.g. BLUFF Thai pack v1 drafted by Claude, approved by the owner), artwork and other creative assets.

## 4. Open questions (owner)

| ID  | Question                                                                             | Proposed default                                                               |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| BR1 | Is "AumMon Object Battle Card" the new public name of EDO Battle (deferred, hidden)? | yes — rename display text only when it returns; internal id `edo_battle` stays |
| BR2 | Show "AumMon BLUFF" (not just "BLUFF") in the app header and share text?             | yes                                                                            |
