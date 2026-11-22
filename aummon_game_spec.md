# AumMon — Game Spec (Casual Discard Edition)

> Version 10.0 · `ruleset_version = "9"` (Quick Match QM1–QM6 + balance pack Q1/Q4, owner 2026-11-22) · approved by owner 2026-11-22 (DC1–DC7). Replaces the retired 1v1 TCG (rulesets 1–6).
> Architecture, database and security: `aummon_project_blueprint.md`.

## 1. Platform decisions (LOCKED)

- Web game (mobile first), Thai UI, theme "Everyday Objects".
- Modes (Pass & Play removed by the owner 2026-11-22, DC8): **Solo** vs 1–7 server bots · **Online** rooms (2–8 seats; a leaving player is replaced by a bot).
- Server-authoritative; clients send intent only. Hands and peeks are private to their seat.
- Accounts, profiles, admin, sound and music settings are shared platform features.
- VIP and cosmetic gacha: designed later; nothing paid is built before a legal check and owner approval (DC7).

## 2. Rules (LOCKED)

| Topic | Authoritative document |
| --- | --- |
| Core rules (turns, pile, reset, reactions, winning) | [`docs/discard/AumMon_Core_Rules.md`](./docs/discard/AumMon_Core_Rules.md) |
| 16 cards × 4 copies = 64 | [`docs/discard/AumMon_Card_Library.md`](./docs/discard/AumMon_Card_Library.md) |
| Owner decisions DC1–DC7, open questions | [`docs/discard/AumMon_Rule_Clarification.md`](./docs/discard/AumMon_Rule_Clarification.md) |
| Quick Match (ruleset "8", approved) | [`docs/discard/AumMon_Quick_Match_Proposal.md`](./docs/discard/AumMon_Quick_Match_Proposal.md) |
| Quality upgrade 9–10 (audit, proposals, playtest protocol) | [`docs/discard/AumMon_Game_Design_Upgrade.md`](./docs/discard/AumMon_Game_Design_Upgrade.md) |
| Simulation and balance | [`docs/discard/AumMon_Card_Balance.md`](./docs/discard/AumMon_Card_Balance.md) |

Card data in code: `packages/game-engine/src/discard/cards.ts` (must match the Card Library).
Any change that affects game results needs owner approval and a new `ruleset_version`.

## 3. Art

Visual direction, style, characters and the AI art pipeline: [`docs/art-production/`](./docs/art-production/) (owner approves direction, Style Bible and each character).
