# AumMon — Technical Migration Plan v2 (15.10 — draft, awaiting owner approval)

> Turns the approved designs (15.3–15.9) into an ordered build plan for 15.11. Append-only migrations, Dev project only (`AumMon-Dev`); no production work (15.14). Test plan: `AumMon_Test_Strategy.md`.

## 1. Architecture impact (summary; detail in each design doc)

| Area      | Change                                                                                            | Design doc                      |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| Auth      | anonymous sign-ins on; `private.is_guest()`; `requireAccount()`; guest cleanup job                | Guest_First_Architecture        |
| Engine    | SDK `pendingSeats` / `tick` / `seatCount` / optional `bot`; new pure module `bluff` (ruleset "2") | Game_Modes, Flagship_Game_Bluff |
| Server    | orchestrator multi-seat path; `allowsStaleVersion` locks; room settings; content selection        | Game_Modes, Content_Management  |
| Data      | 2–8 seats; `casual` mode; room settings; content tables; seat nickname snapshot on matches        | §2                              |
| UI        | dark party theme; v2 Home / Lobby / BLUFF / Results / Profile (guest) / Admin content             | UI_UX_Guidelines                |
| Unchanged | EDO engine + its tables (hidden, kept — Q1); admin RBAC + MFA; rate limits; idempotency; Realtime | —                               |

`docs/architecture/MASTER_ARCHITECTURE.md` gets a short "v2" section pointing here (done in this task).

## 2. Migrations (in order, each with pgTAP tests)

| #   | Migration                     | Content                                                                                                                                                               |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | `v2_guest_identity`           | `private.is_guest()`; `profile-update` support (nickname rules); config `enable_anonymous_sign_ins = true` (local + Dev dashboard)                                    |
| M2  | `v2_seats_2_to_8`             | widen checks: `game_rooms.max_players` 2–8, `match_players.seat` / `room_players.seat` 1–8 (and any private runtime seat checks); `mode` adds `casual`                |
| M3  | `v2_room_settings`            | `game_rooms.settings jsonb` (timer speed, humor, group) with check; copied to `matches.settings` at start                                                             |
| M4  | `v2_guest_cleanup`            | `match_players.user_id` / `room_players.user_id` → `on delete set null` + `display_name_snapshot` on `match_players`; `private.cleanup_guests()`; pg_cron daily job   |
| M5  | `v2_content`                  | `private.content_items`, `private.content_item_history`, `private.content_reports`; checks (§2 Content Management); `content_editor` / `content_reviewer` admin roles |
| M6  | `v2_content_seed_bluff_th_v1` | 150 items from `docs/v2/content/bluff_th_v1_draft.json` as `draft` (owner approves in admin, C1)                                                                      |
| M7  | `v2_bluff_registry`           | `public.games` row `bluff` (min 2, max 8, ruleset "2", enabled on Dev); per-round `content_id` + `content_version` on match rounds                                    |
| M8  | `v2_account_only_guard`       | restrictive `not private.is_guest()` policy helper ready for future account-only tables (none yet in MVP) + pgTAP proving it                                          |

- Every change to an existing table is additive or widens a check; no data is deleted. EDO rows stay valid (seats 1–4 ⊂ 1–8).
- Dev reset is allowed (pre-production); production does not exist yet.

## 3. Build slices for 15.11 (each = one PR, CI green, roadmap sub-task)

| Slice | Content                                                                                    | Depends |
| ----- | ------------------------------------------------------------------------------------------ | ------- |
| S1    | SDK simultaneous decisions + contract tests (EDO golden tests unchanged)                   | —       |
| S2    | `bluff` engine module: phases, scoring per variant, tie-break, hidden view                 | S1      |
| S3    | M1 + M4 + guest sign-in in UI (Home nickname), `requireAccount()`                          | —       |
| S4    | M2 + M3 + M7: Casual rooms 2–8 with settings; orchestrator multi-seat path; BLUFF playable | S2, S3  |
| S5    | M5 + M6 + server content selection; admin content review UI; player report                 | S4      |
| S6    | BLUFF UI from the prototype (live data, timers, Realtime), Results + share                 | S4      |
| S7    | Account linking UI (Profile) + guest sign-out warning                                      | S3      |
| S8    | v2 Home replaces Game Center home; EDO hidden; prototype route removed; docs + handoff     | S6, S7  |

## 4. Risks

| Risk                                                 | Mitigation                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Concurrent locks at phase end                        | row lock + stale-version allowed for lock commands; backend concurrency test |
| Guest abuse / MAU growth                             | IP rate limit, room-create limit, Turnstile before launch (G1), admin metric |
| Known flaky backend test (EDO solo, bot moves first) | fix in S1 (deterministic first seat in the test) before relying on CI        |
| Realtime message volume with 8 players               | one broadcast per phase change; measured in playtest                         |

## 5. Owner approval

| ID  | Question                                         | Proposed default |
| --- | ------------------------------------------------ | ---------------- |
| T1  | Approve migrations M1–M8 and slices S1–S8 order? | yes              |
| T2  | Remove the `/prototype/bluff` route in S8?       | yes              |
