# AumMon — Game Modes & SDK Simultaneous Decisions (15.7)

> **APPROVED by owner 2026-11-25** (M1–M3 = proposed defaults). Casual = MVP (R2, R3). Ranked = post-MVP, architecture only here; rating / tiers / seasons are 15.8. Guest rules: `AumMon_Guest_First_Architecture.md`.

## 1. Modes

| Item          | Casual (MVP)                                                               | Ranked (post-MVP)                                                   |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Who           | guests + accounts                                                          | accounts only (`requireAccount()`, Q3)                              |
| Entry         | private room: create → code / link → join → ready → host starts            | queue (reuses `matchmaking.ts`), per game + size bucket             |
| Players       | game min–max (BLUFF 2–8); no bots (Q7)                                     | fixed sizes (BLUFF 4 or 6) so ratings compare                       |
| Settings      | host: timer speed normal / slow ×1.5, humor 1–2, `group` prompts on / off  | fixed: normal timers, humor 1, no `group`, items with `ranked` mode |
| Result effect | Casual stats only, never rating                                            | rating change (15.8); dodge / AFK penalties                         |
| After match   | rematch in the same room (existing)                                        | back to queue                                                       |
| Leave / AFK   | seat kept for the reconnect window, then timeout defaults; match continues | same + counted as AFK for penalties                                 |

- Room settings are stored on the room, shown to everyone in the lobby before start (R2), copied into the match at start (immutable during the match).
- `match.mode` gets `casual` / `ranked` (existing `solo` / `online` / `quick_match` stay for EDO). Exact columns → 15.10.

## 2. SDK: simultaneous decisions

Today `GameModule.actingSeat(state)` returns **one** seat; `flow.advance` loops bots / timeouts for that seat. BLUFF needs every seat to act in the same phase. Additive, backwards compatible (EDO unchanged):

| Addition (optional)             | Meaning                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pendingSeats?(state): Seat[]`  | seats that may still act in this phase. Absent → `[actingSeat]` (or `[]` when null). `actingSeat` returns `null` in a simultaneous phase. |
| `tick?(state, rng): Transition` | called when the phase deadline passes and **no** seat is pending (Read / Reveal / Score phases): moves to the next phase.                 |
| `seatCount(state): number`      | replaces the `handCounts(state).length` trick (EDO implements it as before).                                                              |
| `bot?`                          | becomes optional; a module without bots cannot be created with bot seats (BLUFF MVP).                                                     |

Orchestrator rules (`flow.ts` + `_shared/game.ts`):

1. A command is accepted from any seat in `pendingSeats(state)`; others get `409 not_your_turn`. Commands that mark `allowsStaleVersion` (BLUFF `claim`, `lock`) skip the `expectedVersion` check, so two players locking at the same moment never conflict; the per-match row lock still serializes them; idempotency keys unchanged.
2. **One deadline per phase** (`timerKey` = phase id + round). `deadlineAfterAct` keeps the deadline while `timerKey` is unchanged, even if the pending set shrinks.
3. Early end: when the last pending seat acts, the module itself moves to the next phase inside `apply` (e.g. Lock → Reveal); a new deadline starts.
4. Deadline passed:
   - pending seats left → apply `timeoutCommands(state, seat)` for **each** pending seat in seat order, emit `timeoutEvent(seat)`, increment that seat's timeout counter (AFK);
   - no pending seats → `tick`.
5. Timers are lazy as today: applied on the next `game-view` / command after the deadline (+ `GRACE_MS`); clients poll / receive Realtime and call `game-view` at the deadline, so no server cron is needed.
6. Hidden choices: the module stores answers / predictions / wagers in state; `view(state, seat)` shows a seat only its own choice and, for others, only `locked: true` until Reveal. `publicEvent` for `lock` carries the seat only; claims are public text. Broadcasts never include hidden fields (existing rule).
7. AFK: a seat with ≥ `afkTimeouts` consecutive missed phases is shown "AFK" and keeps receiving timeout defaults (no bot takeover in Casual — there are no BLUFF bots); acting again resets the counter.

## 3. BLUFF module sketch (`packages/game-engine/src/bluff/`)

- `GameId` adds `"bluff"`; registry row in `public.games` (min 2, max 8, ruleset `"2"`).
- Phases: `read → claim → lock → reveal → score` × 5 rounds → finished (Bluff §3). `pendingSeats`: `claim` = seats that have not claimed (claim optional, phase still ends on its timer); `lock` = seats not locked; others `[]`.
- Content: the server passes the 5 selected `content_id` + version into `start` (selection is a server query, §2 of Content Management); the engine never reads the database.
- `result(state)`: placements with the approved tie-break; Casual stats from it.

## 4. Tests (Phase 11)

- SDK contract tests run for every registered module (EDO + BLUFF): single-seat path unchanged (existing golden / flow tests must stay green), simultaneous path: any pending seat may act, early advance, per-seat timeout defaults, tick phases, deadline kept while the phase is the same.
- BLUFF engine: scoring table per variant (2 / 3–4 / 5–8), tie-break, hidden view, stale-version lock accepted.
- Backend: 3 guests play a full Casual match with two locks sent concurrently; a non-pending seat gets 409; a silent seat gets defaults after the deadline.

## 5. Open questions (owner)

| ID    | Question                                                                                | Proposed default                        |
| ----- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| M1 ✅ | Casual host settings = timer speed, humor 1–2, `group` on / off (nothing else for MVP)? | yes                                     |
| M2 ✅ | AFK in Casual: keep the seat with timeout defaults, never kick?                         | yes                                     |
| M3 ✅ | Ranked later with fixed BLUFF sizes 4 and 6?                                            | yes (decide in 15.8 with rating design) |
