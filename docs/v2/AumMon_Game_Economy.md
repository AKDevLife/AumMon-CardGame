# AumMon — Game Economy (15.8)

> Status: **design only — built post-MVP** (15.8, audit P4). Server-authoritative; nothing affects game results (no pay-to-win). Updates `docs/discard/AumMon_VIP_Cosmetics_Design.md` (12.7) for v2; its principles, legal checklist (§6) and owner questions (Q1–Q5) still apply.

## 1. Items (cosmetic only)

Profile frames, titles, avatar sets, name colours, claim / taunt styles, reveal animations, room themes (host). Rarity: common / rare / epic — cosmetic only.

## 2. Currencies

| Currency          | Earned by                        | Spent on                        |
| ----------------- | -------------------------------- | ------------------------------- |
| เหรียญ (coins)     | levels, missions, season rewards | common / rare items in the shop |
| เพชร (gems, paid) | purchase only (post legal check) | epic items, VIP pass            |

- Every item has a direct price (no item only from random draws). Gacha stays **off** until the 12.7 legal check + owner decision (Q2).
- Guests may earn and spend coins; buying gems requires an account (confirmed e-mail) and the age threshold (Q4).
- Coin faucet target: ~150 coins / day for a regular player; common item 300, rare 1,200 → a rare item about once a week.

## 3. VIP (host pass, v2)

- 30-day pass, no auto-renew (12.7 Q1 default): monthly cosmetic, room themes for rooms you host, +1 custom room nickname colour; no gameplay or scoring effect, no extra content advantage.

## 4. Data

Unchanged from 12.7 §7: private `catalog_items`, `user_items`, `wallets`, `wallet_ledger` (append-only), `orders`, `vip_subscriptions`; Edge Functions only, idempotency keys, server-side receipt validation.
