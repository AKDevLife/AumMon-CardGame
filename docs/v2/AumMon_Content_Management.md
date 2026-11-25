# AumMon — Content Management (15.9)

> Status: **APPROVED by owner 2026-11-25** (C1–C4 = proposed defaults). Design for MVP (R5). First BLUFF pack drafted by Claude for owner review (Q6): `docs/v2/content/bluff_th_v1_draft.json` (150 items, all `draft`). Built in Phase 11 (migration + admin UI); this task is design + draft only.

## 1. Goals

- Game text lives in the database, not in engine / UI code; admin adds, edits and retires items without an engine release (R5 AC).
- Only `approved` items reach matches. Every item has a `locale` (Thai first, English later — P6, Q5).
- Never target real private individuals; group-directed prompts are opt-in per room (humor level + `group` tag).

## 2. Schema (`private.content_items`)

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

## 3. Review flow

```
draft ──submit──▶ in_review ──approve──▶ approved ──retire──▶ retired
  ▲                  │ reject (note)          │ edit = new version → in_review
  └──────────────────┘                        ▼
```

- Roles: `content_editor` writes / submits; `content_reviewer` (owner for MVP) approves, rejects with a note, retires. Admin role from Phase 9 can do both; a reviewer may not approve their own edit once there are 2+ reviewers.
- Editing an item creates a new version in `in_review` (history keeps the old text); it stops serving until re-approved (MVP simplification).
- Player report button (post-reveal, "เนื้อหาไม่เหมาะสม"): 3 reports from different players auto-moves an item to `in_review`.
- All actions are server commands (Edge Function) with role checks and an audit row; no direct table access from clients.

## 4. Writing guide (BLUFF)

- One everyday situation, 4 believable options; no right answer; the "obvious" option should not get > 60 % (playtest telemetry flags items with a dominant option or a 0 % option).
- Categories (MVP pack, 15 each): `food`, `money`, `love`, `work_school`, `friends`, `social`, `travel`, `home`, `hypothetical`, `chaos`.
- Humor 1 = safe for anyone; 2 = light teasing (exes, bosses, awkward moments). No politics, religion, royal family, sexual content, real people, brands insulting, or self-harm.
- `group` items (refer to people in the room) need 3+ players and are off by default.

## 5. Draft pack v1 (for owner review)

`docs/v2/content/bluff_th_v1_draft.json`: 150 items · 10 categories × 15 · humor 1: 98, humor 2: 52 · 3 `group` items. It becomes the seed migration in Phase 11; the owner's review decides `approved` / edit / drop per item.

## 6. Open questions (owner)

| ID    | Question                                                                     | Proposed default                |
| ----- | ---------------------------------------------------------------------------- | ------------------------------- |
| C1 ✅ | Review the 150 draft items (approve / edit / drop) before the playtest (Q6)? | yes — owner reviews in admin UI |
| C2 ✅ | Humor levels 1–2 only for MVP; room default = 2?                             | yes                             |
| C3 ✅ | `group` prompts off by default, host can enable?                             | yes                             |
| C4 ✅ | Auto-hide an item after 3 player reports?                                    | yes (moves to `in_review`)      |
