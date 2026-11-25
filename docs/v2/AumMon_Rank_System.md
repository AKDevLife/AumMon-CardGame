# AumMon — Rank System (15.8)

> Status: **design only — built post-MVP** (15.8, audit P4). Server-authoritative; nothing affects game results (no pay-to-win). Ranked is account-only (Q3); fixed BLUFF sizes 4 and 6 (M3).

## 1. Rating

- Multiplayer skill rating **OpenSkill (Weng-Lin / Plackett-Luce)** — open-source, works for free-for-all placements, no licence cost. Per account × game × size bucket: `mu`, `sigma`.
- Shown rating = round((mu − 3 σ) × 40 + 1000) — rises as the system becomes confident.
- Placement: first 5 Ranked matches show "กำลังจัดอันดับ"; tier appears after.
- Ties use the approved tie-break; a shared place counts as a tie in the rating update.

## 2. Tiers

Bronze < 1100 · Silver < 1250 · Gold < 1400 · Platinum < 1550 · Diamond ≥ 1550 · **Master** = top 100 Diamond per season. Each tier I–III for display only.

## 3. Seasons

- 8 weeks. Soft reset: sigma raised toward the start value, mu moved 50 % toward the default. End-of-season cosmetic reward by highest tier reached.

## 4. Integrity

- Solo queue only at first (no premade parties); two accounts from the same device / IP hash are never placed in one match.
- Account must have a confirmed e-mail and ≥ 3 finished Casual matches.
- AFK (≥ 50 % phases timed out) or leaving = counted as last place + 5 min queue cooldown (doubling, reset daily).
- Rating changes are written by the server in the match-finish transaction; history kept (`rating_history`, append-only) for admin review and rollbacks after cheating reports.
