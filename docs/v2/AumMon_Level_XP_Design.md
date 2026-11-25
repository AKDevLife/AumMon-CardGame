# AumMon — Level & XP Design (15.8)

> Status: **APPROVED by owner 2026-11-25 (E1–E4), design only — built post-MVP** (15.8, audit P4). Server-authoritative; nothing affects game results (no pay-to-win).

## 1. XP per match (server computes from the match result)

| Source                                    | XP          |
| ----------------------------------------- | ----------- |
| Finish a match (not AFK > 50 % of phases) | 20          |
| Each correct prediction (BLUFF)           | 3           |
| Bluff or Honest point earned              | 2           |
| Placement 1st / 2nd / 3rd                 | 15 / 10 / 5 |
| First match of the day                    | +30         |

- Casual and Ranked give the same XP (Ranked has its own rating). Guests earn XP too; it stays on linking (same id).
- Anti-farm: after 20 matches per day XP × 0.5; matches where every other seat timed out all phases give 0 XP.

## 2. Levels

- XP to next level = 100 + 25 × (level − 1); no level cap. Level 10 ≈ 2,100 XP ≈ 25 matches.
- Levels unlock cosmetics only (frames, titles, claim / taunt styles) and soft coins (Economy §2). Never gameplay power.

## 3. Missions & achievements

- Daily: 3 missions from a pool (e.g. "ทายถูก 5 ครั้ง", "ชนะด้วยการ bluff 1 ครั้ง", "เล่นกับเพื่อน 2 แมตช์"); weekly: 1 bigger mission. Reward: coins + XP.
- Achievements: one-time badges (first win, 10 correct reads in a match, …). Progress stored per user in `private.user_progress`.

## 4. Data (sketch, private schema, Edge Functions only)

`user_progress` (user, xp, level, updated_at) · `xp_ledger` (append-only: match_id, source, amount) · `mission_state` · `achievements`. XP is granted in the same transaction that finishes the match (idempotent per match + user).
