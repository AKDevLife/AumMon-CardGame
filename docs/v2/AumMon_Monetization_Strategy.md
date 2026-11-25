# AumMon — Monetization Strategy & Cost Model (15.8)

> Status: **design only — built post-MVP** (15.8, audit P4). Server-authoritative; nothing affects game results (no pay-to-win). Prices below are **assumptions from audit §8** and must be re-checked on the providers' pricing pages before any paid plan is enabled (owner approval required — CLAUDE.md).

## 1. Costs

| Stage                   | Supabase                       | Vercel               | Other               | Monthly (≈)          |
| ----------------------- | ------------------------------ | -------------------- | ------------------- | -------------------- |
| Closed playtest (MVP)   | Free                           | Hobby                | —                   | 0                    |
| Small launch (≤ 5k MAU) | Pro ≈ US$25 + usage            | Pro ≈ US$20 / member | domain, SMTP ≈ US$5 | ≈ US$50 ≈ 1,800 THB  |
| Growth (≤ 50k MAU)      | Pro + compute / egress ≈ US$75 | Pro + usage ≈ US$40  | SMTP ≈ US$20        | ≈ US$135 ≈ 4,900 THB |

- Main variable cost drivers: Realtime messages (one broadcast per phase change × players), Edge Function invocations (polling at deadlines), guest MAU. BLUFF sends ~25 phase events per match — cheap.
- Watch list (admin dashboard, Phase 11): guests / day, matches / day, Realtime messages, function invocations vs plan quotas.

## 2. Revenue options (in order)

1. **Cosmetic shop** (gems) — after the legal check and payment provider (12.7 Q5).
2. **VIP host pass** — 30 days, no auto-renew.
3. Optional later: non-intrusive ads only between matches on the results screen, never in gameplay (owner decision).

## 3. Break-even (assumptions)

- Payment fee ≈ 3–4 % + fixed per transaction → net ≈ 90 THB from a 99 THB purchase.
- Small launch costs ≈ 1,800 THB / month → **≈ 20 paying players / month**; at 2 % payer conversion ≈ **1,000 MAU**.
- Growth stage ≈ 4,900 THB → ≈ 55 payers ≈ 2,750 MAU at 2 %.

## 4. Guardrails

- No pay-to-win, no paid random boxes before the legal check, odds always shown, spending caps for minors per legal advice, refunds through the provider, all purchases audited.

## 5. Open questions (owner, for all four 15.8 docs)

| ID  | Question                                                                                  | Proposed default       |
| --- | ----------------------------------------------------------------------------------------- | ---------------------- |
| E1  | XP / levels / missions as in `AumMon_Level_XP_Design.md`; guests earn XP?                 | yes                    |
| E2  | Ranked: OpenSkill rating, 8-week seasons, tiers Bronze → Master, solo queue first?        | yes                    |
| E3  | Economy: coins (earned) + gems (paid), cosmetics only, gacha still off until legal check? | yes                    |
| E4  | Revenue order: cosmetic shop → VIP host pass; ads only later and only on results screen?  | yes; ads decided later |
