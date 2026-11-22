# AumMon — VIP + Cosmetic Gacha Design (task 12.7)

> Status: **design only — nothing is built** (DC7, F8). Building needs: core game done (12.8), a legal check of payments / loot boxes in Thailand, and owner approval of the open questions in §8.
> Never changes game rules: no card, ability, draw chance, turn time or win chance can be bought (Core Rules §8, spec §1).

## 1. Principles

1. **Cosmetic only.** VIP and items change looks and room convenience, never results. Bots and the engine ignore cosmetics.
2. **Server-authoritative.** Ownership, purchases and gacha draws are computed and stored by the server; clients only send intent (item id, idempotency key).
3. **Transparent.** Every random draw shows its odds before payment; every item can also be earned or bought directly (no item is gacha-only — recommended, §8 Q3).
4. **Safe for minors.** Spending limits and age gate before any payment (§6).
5. **Free game stays complete.** Solo, Online 2–4, all 16 cards and the tutorial stay free forever.

## 2. VIP

| Benefit          | Detail                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Host large rooms | Create Online rooms of 5–8 seats (Core Rules §2). Guests in a VIP room play free.            |
| Room options     | Custom room name, private-room lock, choose a table theme the whole room sees.               |
| Cosmetic bonus   | Monthly VIP card back + profile frame; +1 free gacha ticket per week (if gacha is approved). |
| Badge            | VIP badge on the profile and seat.                                                           |

- Form: monthly subscription or a fixed-length pass (e.g. 30 days, no auto-renew) — **owner decides (Q1)**; a pass without auto-renew is simpler legally.
- Until VIP is built, 5–8 seat rooms stay free on Dev (DC7).
- Expiry: running games finish normally; an expired host can no longer create 5–8 seat rooms; owned cosmetics stay.

## 3. Cosmetic items

| Type                                    | Where it shows                                     | Priority                           |
| --------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| Emotes (sticker reactions at the table) | Table, all seats                                   | 1 — needs the emote feature (13.9) |
| Card backs                              | Own hand / draw pile for own view, seat card count | 2                                  |
| Profile / seat frames                   | Lobby, seat, result screen                         | 3                                  |
| Table themes                            | Table background (room-wide in VIP rooms)          | 4                                  |

- Art follows the approved Art Direction / Style Bible (Phase 13); no item before 13.3 is locked.
- Rarity: Common / Rare / Epic — looks only.

## 4. Earning and buying

| Source               | Gives                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Play rewards (free)  | Coins per finished round (capped per day), first-win-of-day bonus |
| Direct shop          | Any item at a fixed coin or money price                           |
| Gacha (optional, §5) | Random item from a published pool                                 |

- Two currencies at most: **coins** (earned only) and **gems** (bought). Gems never convert back to money.
- Prices are shown in THB as well as gems.

## 5. Gacha (only if the owner and legal check approve)

- Pools list every item and its **exact odds** before the draw; odds are stored with each draw for audit.
- **Pity:** guaranteed Epic within N draws (N published); duplicates convert to coins.
- Draw RNG runs server-side with a stored seed per draw (same audited approach as the engine's seeded RNG); never `Math.random` in the client.
- Daily paid-draw cap; no time-limited pressure timers; no gacha for accounts under the age threshold (§6).
- Alternative if gacha is rejected: rotating direct shop only (recommended fallback).

## 6. Legal / safety checklist (before building — owner + legal advisor)

- [ ] Thai consumer-protection and e-payment rules for digital goods and subscriptions.
- [ ] Loot-box / gambling classification of paid random draws in Thailand and target app stores.
- [ ] Minors: age gate, parental consent, monthly spending limit.
- [ ] Refund policy, terms of sale, receipts / tax (VAT) handling.
- [ ] PDPA: payment data stays with the payment provider; we store only order ids and status.
- [ ] Payment provider choice (Stripe / Omise / app-store billing) — paid service, owner approval (CLAUDE.md).

## 7. Technical sketch (for the later build task)

- Tables in `private` schema, written only by Edge Functions with the service role: `catalog_items`, `user_items`, `wallets`, `wallet_ledger` (append-only), `orders`, `gacha_pools`, `gacha_draws`, `vip_subscriptions`.
- Exposed read-only views/RPCs return **only the caller's own** items, wallet and VIP status (RLS); other players see only equipped cosmetics through the room/seat data.
- Payment webhooks verified by signature in an Edge Function; idempotent by provider event id; ledger entries are never edited.
- Room creation checks VIP server-side for 5–8 seats; the engine and `ruleset_version` are untouched.
- Admin: catalog and pool management with the existing RBAC + audit log (Phase 9).
- Tests: ledger balance invariants, idempotent webhooks, odds/pity simulation, RLS denies cross-user reads.

## 8. Owner decisions needed (open)

| #   | Question                                       | Recommendation                                               |
| --- | ---------------------------------------------- | ------------------------------------------------------------ |
| Q1  | VIP as auto-renew subscription or 30-day pass? | 30-day pass first                                            |
| Q2  | Include paid gacha at all?                     | Start with direct shop; add gacha only after the legal check |
| Q3  | Every item also directly buyable / earnable?   | Yes                                                          |
| Q4  | Age threshold for payments / gacha             | Per legal advice (e.g. 18 for gacha)                         |
| Q5  | Payment provider                               | Decide with the legal check                                  |

Answers go to `AumMon_Rule_Clarification.md` (new DC entry); the build becomes new roadmap tasks after 12.8.
