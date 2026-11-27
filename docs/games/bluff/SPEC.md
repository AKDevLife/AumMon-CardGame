# AumMon BLUFF — Game Spec

> Social party game, 2–8 players (empty seats → bots), ruleset `"2"`. Engine: `packages/game-engine/src/bluff/`. Content pack: `docs/games/bluff/content/bluff_th_v1.json`. Shared platform: `docs/platform/PLATFORM_SPEC.md`.

## 1. Rules & scoring

> Status: **APPROVED by owner 2026-11-25** (B1–B5 = proposed defaults); BLUFF `ruleset_version` `"1"`; **ruleset `"2"` approved 2026-11-25 (15.4)**: 2-player no Bluff / Honest points. Player-count tuning is task 15.4; content schema is 15.9.

### 1. Concept

A situation appears with 4 options. Everyone secretly picks what **they** would do, then guesses what **the room** picked most, and may wager on that guess. Before locking, players may make one short public **claim** ("ฉันเลือก B") — true or a bluff. Reveal shows everything at once; narration teases the room.

Skill = reading friends + bluffing them. No right/wrong answers, so content is cheap to write (~150 items, Q6).

### 2. Match

- 2–8 players, 5 rounds, ~6–9 min. Everyone starts at 0; scores may go negative.
- Round 5 scores ×2 ("final round") so trailing players can come back.
- Each round uses one `approved` content item matching the room's player count, locale and humor level; no item repeats inside a match.

### 3. Round flow (server-timed)

| #   | Phase  | Time | Player action (intent only)                                                             |
| --- | ------ | ---- | --------------------------------------------------------------------------------------- |
| 1   | Read   | 6 s  | — situation + options A–D shown                                                         |
| 2   | Claim  | 15 s | optional: one preset claim "ฉันเลือก X" (X = A–D) or one preset taunt; shown live to room |
| 3   | Lock   | 20 s | **Answer** (A–D), **Prediction** (A–D), **Wager** 0 / 1 / 2                             |
| 4   | Reveal | 8 s  | all answers, predictions, wagers, claims revealed together; narration                   |
| 5   | Score  | 5 s  | round points + scoreboard                                                               |

- Lock ends early when every connected player locked. Answers and predictions stay private (server only) until Reveal.
- Free text chat is out of MVP (moderation); claims and taunts are preset strings only.

### 4. Scoring (per round, before the ×2 final multiplier)

"Top" = the option(s) with the most answers **among the other players** (ties: every tied option counts). In the 2-player variant Top = the opponent's answer.

| Rule        | Points                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Prediction  | Prediction ∈ Top → **+2 + wager**; otherwise **− wager**                                                                     |
| Crowd (3+)  | Your answer is (one of) the most-picked overall → **+1**                                                                     |
| Bluff       | Claim ≠ your answer: **+1 per opponent** who predicted your claimed option and was wrong; cap 1 (3–4p), 2 (5–8p); none in 2p |
| Honest (3+) | Claim = your answer and at least one opponent predicted it → **+1**                                                          |

- Wager > 0 pays only when the guess hit rate is above 50 % (EV = 2p + w(2p − 1)), so wagering is a confidence call, not a free bonus.
- **Timeout default:** no answer (not counted in votes, no Crowd), no prediction (0), wager 0, no claim. A disconnected seat gets the same default after the reconnect window (R3).
- **Final tie-break:** most correct predictions → most Bluff + Honest points → shared place (both shown as winners).

### 5. Variants (tuned in 15.4 — see `docs/games/bluff/SPEC.md`; ruleset "2" proposed)

| Players | Differences                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------- |
| 2       | Prediction = guess the opponent's answer; no Crowd; **no Bluff / Honest points** (ruleset "2") |
| 3–4     | Rules as §4                                                                                    |
| 5–8     | Bluff cap 2; content may use group prompts ("ใครในห้องนี้…" excluded from MVP unless reviewed)    |

### 6. Simulation (Monte Carlo, 20,000 matches per size, seeded; original script in PR #120, superseded by the 15.4 `scripts/bluff-sim.mjs`)

Strategies: R random · S reads the crowd · B = S + always bluffs · W = S + always wager 2 · H = S + honest claim. Simulated listeners trust claims a little (naive), which favours bluffers — real players will adapt.

| Players | Tie % | R win | S win | B win | W win | H win |
| ------- | ----: | ----: | ----: | ----: | ----: | ----: |
| 2       |   4.9 |   37% |   48% |   76% |   40% |   61% |
| 3       |   6.8 |   19% |   28% |   43% |   44% |   44% |
| 4       |   7.7 |   12% |   17% |   35% |   34% |   37% |
| 5       |   8.8 |    6% |    9% |   40% |   23% |   31% |
| 8       |  11.3 |    3% |    3% |   29% |   16% |   19% |

Findings:

- Random play loses clearly at 3+ players → skill matters. Honest claims are as strong as bluffs at 3–4 players (Honest bonus added after v0 runs where bluff won 47–51 %).
- **2-player bluff is too strong** against naive listeners (76 %) → 15.4 must tune (e.g. no Bluff points in 2p, or claim optional only from round 2).
- Using a claim always beats silence (S) → intended ("Bluff More"), but 15.4 should check that silent players still have a fair path.
- Ties ≤ 11 % before tie-break; the tie-break resolves most.

### 7. Server / engine notes

- Pure engine module `bluff` in `packages/game-engine` (no RNG beyond the seeded match RNG for item order).
- Commands: `bluff.claim`, `bluff.lock` with idempotency key; server rejects locks after the timer and answers/wagers outside the allowed range.
- Broadcast before Reveal: only who has claimed (claim text) and who has locked — never answers, predictions or wagers.

### 8. Open questions (owner)

| ID    | Question                                                           | Proposed default               |
| ----- | ------------------------------------------------------------------ | ------------------------------ |
| B1 ✅ | Approve the core loop (answer + crowd prediction + wager + claim)? | yes                            |
| B2 ✅ | Wager 0–2 per round, or a match budget of chips?                   | 0–2 per round (simpler)        |
| B3 ✅ | Final round ×2?                                                    | yes                            |
| B4 ✅ | 2-player fix: remove Bluff points or keep and re-tune in 15.4?     | re-tune in 15.4                |
| B5 ✅ | Phase timers 6 / 15 / 20 / 8 / 5 s OK?                             | yes; host may pick "slow" ×1.5 |

## 2. Player-count balance (ruleset 2)

> Status: **APPROVED by owner 2026-11-25** (P1–P2 = proposed defaults) — BLUFF `ruleset_version` `"2"` (2-player scoring change only). Base rules: `docs/games/bluff/SPEC.md` (ruleset "1").
> Simulation: `node scripts/bluff-sim.mjs` (all variants × listener trust; ~30 s) and `--h2h` (2-player head-to-head). Seeded, 20,000 matches per cell.

### 1. Method

- Strategies as in Bluff §6: R random · S silent reader · B bluffer · W silent reader, wager 2 · H honest claimer.
- New: **listener trust** = how much predictors follow claims: `0.25` naive (15.3 model) · `0.1` cautious · `0` ignore · `−0.15` contrarian. Real groups drift from naive toward 0 / contrarian as they learn, so a good variant must hold across the whole range — no strategy should dominate at every trust level.
- Ties now use the approved tie-break (most correct predictions) before counting as shared.
- Fair share in a mixed table = 100 / n % per seat.

### 2. Findings (ruleset "1")

| Players | Problem                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2       | Claim points are free money. Head-to-head vs silent: bluffer 52–69 %, honest **47–72 %** — whichever claim the listener trusts less still scores. Silent can never win. |
| 3–4     | Healthy: B / H / W all 26–49 %, ranking flips with trust (bluff best vs naive, honest best vs skeptics). R ≈ fair share or below → skill matters.                       |
| 5–8     | Healthy for claimers and wagering; plain silent S at 3–10 % (< fair share 12–20 %). Silent + confident wager (W) reaches 14–22 % ≈ fair share → silent path exists.     |

Rejected tunings:

- **Claim from round 2** (all sizes): 2p bluffer still 55–70 %; little effect elsewhere.
- **2p no Bluff points only**: bluffer fixed (47–58 % vs S) but honest claim still 47–72 %.
- **Silent bonus +1 (5–8p)**: W jumps to 21–31 % and honest claimers fall below silent — over-corrects.

### 3. Proposal — ruleset "2"

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

### 4. Per-count notes (no rule change)

- **Content:** items tagged `min_players` / `max_players` (15.9); group prompts only in 5–8.
- **Timers:** keep 6 / 15 / 20 / 8 / 5 s for all sizes (lock ends early when all locked); revisit after playtest (15.13 telemetry: lock time p90 per size).
- **Playtest checks (Phase 12 of the audit):** per size, win rate of players who never claim; claim usage %; how often naive trust appears (predictions = claimed option).

### 5. Open questions (owner)

| ID    | Question                                                                  | Proposed default |
| ----- | ------------------------------------------------------------------------- | ---------------- |
| P1 ✅ | Approve ruleset "2": 2-player no Bluff / Honest points?                   | yes              |
| P2 ✅ | Keep 3–8 unchanged (no silent bonus; show correct-read count on results)? | yes              |

## 3. Content management

> Status: **APPROVED by owner 2026-11-25** (C1–C4 = proposed defaults). Design for MVP (R5). First BLUFF pack drafted by Claude for owner review (Q6): `docs/games/bluff/content/bluff_th_v1.json` (150 items, all `draft`). Built in Phase 11 (migration + admin UI); this task is design + draft only.

### 1. Goals

- Game text lives in the database, not in engine / UI code; admin adds, edits and retires items without an engine release (R5 AC).
- Only `approved` items reach matches. Every item has a `locale` (Thai first, English later — P6, Q5).
- Never target real private individuals; group-directed prompts are opt-in per room (humor level + `group` tag).

### 2. Schema (`private.content_items`)

Private schema (never exposed through the API, aummon-domain.md): players must not browse the pool or pre-read upcoming items. The server picks the item and sends only its text at the Read phase.

| Column                                                                | Type                                           | Notes                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `id`                                                                  | `text` PK                                      | stable slug, e.g. `bluff-th-food-01`                         |
| `game_id`                                                             | `text` → games                                 | `bluff`                                                      |
| `category`                                                            | `text`                                         | see §4                                                       |
| `locale`                                                              | `text`                                         | `th` (MVP)                                                   |
| `humor`                                                               | `smallint` 1–3                                 | 1 สุภาพ · 2 แซวได้ · 3 แสบ (no level-3 items in MVP)           |
| `min_players`                                                         | `smallint` 2–8                                 | `max_players` ≥ `min_players`                                |
| `max_players`                                                         | `smallint` 2–8                                 |                                                              |
| `modes`                                                               | `text[]`                                       | `casual` (MVP); `ranked` later                               |
| `body`                                                                | `jsonb`                                        | per game; BLUFF: `{ "prompt": text, "options": [4 × text] }` |
| `tags`                                                                | `text[]`                                       | `group` = refers to people in the room                       |
| `status`                                                              | `draft` / `in_review` / `approved` / `retired` | check constraint                                             |
| `version`                                                             | `int`                                          | +1 on every text edit                                        |
| `author_id`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at` |                                                | audit                                                        |

- Checks: BLUFF `body` = 4 distinct non-empty options, prompt ≤ 120 chars, option ≤ 40 chars (fits a phone).
- `private.content_item_history` stores every previous version (who / when / old body) — edits never lose text.
- Matches store `content_id` + `content_version` per round, so replays and reports show exactly what players saw.
- Item selection (server): `approved`, matching `game_id`, `locale`, `min_players ≤ n ≤ max_players`, `humor ≤ room humor`, `group` only if the room allows it; no repeat inside a match; prefer items the room's players saw least (per-player seen counts, best effort). Order uses the seeded match RNG.

### 3. Review flow

```
draft ──submit──▶ in_review ──approve──▶ approved ──retire──▶ retired
  ▲                  │ reject (note)          │ edit = new version → in_review
  └──────────────────┘                        ▼
```

- Roles: `content_editor` writes / submits; `content_reviewer` (owner for MVP) approves, rejects with a note, retires. Admin role from Phase 9 can do both; a reviewer may not approve their own edit once there are 2+ reviewers.
- Editing an item creates a new version in `in_review` (history keeps the old text); it stops serving until re-approved (MVP simplification).
- Player report button (post-reveal, "เนื้อหาไม่เหมาะสม"): 3 reports from different players auto-moves an item to `in_review`.
- All actions are server commands (Edge Function) with role checks and an audit row; no direct table access from clients.

### 4. Writing guide (BLUFF)

- One everyday situation, 4 believable options; no right answer; the "obvious" option should not get > 60 % (playtest telemetry flags items with a dominant option or a 0 % option).
- Categories (MVP pack, 15 each): `food`, `money`, `love`, `work_school`, `friends`, `social`, `travel`, `home`, `hypothetical`, `chaos`.
- Humor 1 = safe for anyone; 2 = light teasing (exes, bosses, awkward moments). No politics, religion, royal family, sexual content, real people, brands insulting, or self-harm.
- `group` items (refer to people in the room) need 3+ players and are off by default.

### 5. Draft pack v1 (for owner review)

`docs/games/bluff/content/bluff_th_v1.json`: 150 items · 10 categories × 15 · humor 1: 98, humor 2: 52 · 3 `group` items. It becomes the seed migration in Phase 11; the owner's review decides `approved` / edit / drop per item.

### 6. Open questions (owner)

| ID    | Question                                                                     | Proposed default                |
| ----- | ---------------------------------------------------------------------------- | ------------------------------- |
| C1 ✅ | Review the 150 draft items (approve / edit / drop) before the playtest (Q6)? | yes — owner reviews in admin UI |
| C2 ✅ | Humor levels 1–2 only for MVP; room default = 2?                             | yes                             |
| C3 ✅ | `group` prompts off by default, host can enable?                             | yes                             |
| C4 ✅ | Auto-hide an item after 3 player reports?                                    | yes (moves to `in_review`)      |

## 4. Playtest plan

> Owner-run session on real phones. URL: https://aum-mon-card-game-git-playtest-aum-mon.vercel.app (Dev backend). All 150 BLUFF items approved by the owner (2026-11-25).

### 1. Sessions

| #   | Players | Room settings         | Goal                                             |
| --- | ------: | --------------------- | ------------------------------------------------ |
| 1   |       2 | default               | 2-player ruleset "2" feels fair, no claim points |
| 2   |       4 | default               | core loop, claims / taunts used                  |
| 3   |       8 | slow ×1.5, `group` on | timers, crowd scoring, phone layout with 8 names |

Each session = one full match (5 rounds, ~7–10 min) + one rematch ("กลับห้อง").

### 2. How

1. Host opens the URL → ชื่อเล่น → สร้างห้อง → แชร์ลิงก์.
2. Friends open the link on their own phones (iOS Safari / Android Chrome), no sign-up.
3. Play; at least once: one player closes the browser mid-round and comes back; one player never claims.
4. After the match: tap แชร์ผล once; one player tries โปรไฟล์ → บันทึกบัญชี.

### 3. What to send back (chat)

- Screenshots of anything confusing or broken (as before).
- 1–5 per question: fun? easy to understand? timers OK? (each player).
- Questions that felt bad or too obvious (round number or text).

### 4. What Claude reads afterwards (Dev data, no personal data)

- Per match: players, rounds finished, timeouts per phase (AFK), claim usage %, lock time vs deadline.
- Per item: vote spread (dominant option > 60 % or a 0 % option → rewrite), reports.
- Win rate of players who never claimed (balance check from 15.4).
