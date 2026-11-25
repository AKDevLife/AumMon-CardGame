# AumMon — BLUFF Player Count Balance (15.4 — approved)

> Status: **APPROVED by owner 2026-11-25** (P1–P2 = proposed defaults) — BLUFF `ruleset_version` `"2"` (2-player scoring change only). Base rules: `AumMon_Flagship_Game_Bluff.md` (ruleset "1").
> Simulation: `node scripts/bluff-sim.mjs` (all variants × listener trust; ~30 s) and `--h2h` (2-player head-to-head). Seeded, 20,000 matches per cell.

## 1. Method

- Strategies as in Bluff §6: R random · S silent reader · B bluffer · W silent reader, wager 2 · H honest claimer.
- New: **listener trust** = how much predictors follow claims: `0.25` naive (15.3 model) · `0.1` cautious · `0` ignore · `−0.15` contrarian. Real groups drift from naive toward 0 / contrarian as they learn, so a good variant must hold across the whole range — no strategy should dominate at every trust level.
- Ties now use the approved tie-break (most correct predictions) before counting as shared.
- Fair share in a mixed table = 100 / n % per seat.

## 2. Findings (ruleset "1")

| Players | Problem                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2       | Claim points are free money. Head-to-head vs silent: bluffer 52–69 %, honest **47–72 %** — whichever claim the listener trusts less still scores. Silent can never win. |
| 3–4     | Healthy: B / H / W all 26–49 %, ranking flips with trust (bluff best vs naive, honest best vs skeptics). R ≈ fair share or below → skill matters.                       |
| 5–8     | Healthy for claimers and wagering; plain silent S at 3–10 % (< fair share 12–20 %). Silent + confident wager (W) reaches 14–22 % ≈ fair share → silent path exists.     |

Rejected tunings:

- **Claim from round 2** (all sizes): 2p bluffer still 55–70 %; little effect elsewhere.
- **2p no Bluff points only**: bluffer fixed (47–58 % vs S) but honest claim still 47–72 %.
- **Silent bonus +1 (5–8p)**: W jumps to 21–31 % and honest claimers fall below silent — over-corrects.

## 3. Proposal — ruleset "2"

| Players | Change vs ruleset "1"                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 2       | **No Bluff and no Honest points.** Claims stay (pure mind game); points come only from Prediction + wager. No Crowd (unchanged).          |
| 3–4     | none (Bluff cap 1, Honest +1, Crowd +1)                                                                                                   |
| 5–8     | none (Bluff cap 2). Silent players are served by wagering; results screen should show "อ่านใจถูก X ครั้ง" so a quiet reader still gets credit |

2-player head-to-head after the change (win % of first strategy):

| Trust | B vs S | H vs S | B vs H | S vs R |
| ----- | -----: | -----: | -----: | -----: |
| 0.25  |     58 |     30 |     76 |     58 |
| 0.1   |     53 |     42 |     61 |     58 |
| 0     |     51 |     50 |     51 |     58 |
| −0.15 |     47 |     62 |     36 |     58 |

→ At trust 0 every style is ~50 %; each style beats a specific listener and loses to another (rock-paper-scissors), which is the intended reading game. Reader beats random 58 % (2p luck is high by nature; 5 rounds).

Mixed tables 3–8 are unchanged (see script output): R 2–21 %, B 19–41 %, H 16–49 %, W 14–42 %; ties after tie-break 3–6 %.

## 4. Per-count notes (no rule change)

- **Content:** items tagged `min_players` / `max_players` (15.9); group prompts only in 5–8.
- **Timers:** keep 6 / 15 / 20 / 8 / 5 s for all sizes (lock ends early when all locked); revisit after playtest (15.13 telemetry: lock time p90 per size).
- **Playtest checks (Phase 12 of the audit):** per size, win rate of players who never claim; claim usage %; how often naive trust appears (predictions = claimed option).

## 5. Open questions (owner)

| ID    | Question                                                                  | Proposed default |
| ----- | ------------------------------------------------------------------------- | ---------------- |
| P1 ✅ | Approve ruleset "2": 2-player no Bluff / Honest points?                   | yes              |
| P2 ✅ | Keep 3–8 unchanged (no silent bonus; show correct-read count on results)? | yes              |
