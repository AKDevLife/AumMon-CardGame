# AumMon — Product Requirements (v2 MVP)

> Scope: MVP only (audit §6). Every requirement has acceptance criteria (AC). Post-MVP items are listed at the end and are not built yet.

## R1 Guest session (P1, Q2)

- Supabase Anonymous Sign-in creates a guest user; the client keeps the session; nickname 2–24 chars.
- AC: a new visitor reaches a room lobby without e-mail; refresh keeps the same identity; guest creation is rate limited per IP; expired guests (no activity 30 days) are cleaned up; guests cannot call admin or Ranked endpoints.

## R2 Private Casual room

- Create room (host), share code / link, join, ready, start; 2–8 seats per game's min / max; host settings and fun modifiers shown to everyone before start.
- AC: join by link works for guests and accounts; a full or started room refuses joins; host leaving passes host to the next player; no result affects any rating.

## R3 BLUFF match

- ~5 rounds; each round: situation → private choice → optional wager → simultaneous reveal → server score → narration → scoreboard. Variants for 2, 3–4 and 5–8 players (design in `AumMon_Flagship_Game_Bluff.md`, Phase 3).
- AC: choices stay hidden until every player chose or the round timer ends; timeout = defined default choice; the client never sends scores; disconnect keeps the seat for the reconnect window then auto-plays; ties resolved by a documented rule; a match never waits on one player without a timer.

## R4 Results and share

- Final scoreboard, round highlights, funny title per player; share as image / text with room-free link.
- AC: share content contains nicknames and scores only (no ids, no hidden data); works on iOS Safari and Android Chrome.

## R5 Content

- Content items in the database with id, category, locale, text, tags, player range, modes, humor level, status, review status, version (`AumMon_Content_Management.md`, Phase 9).
- AC: only `approved` items reach matches; admin can add / edit / retire items without an engine release; ~150 Thai items reviewed by the owner before playtest (Q6).

## R6 Optional account and linking (Q4)

- Guest can add e-mail + password; the user id stays the same, so all guest data stays.
- AC: linking an e-mail already owned by another account does not merge — the player is offered to sign in to that account; no XP / history / inventory is lost or duplicated.

## R7 UI

- Minimal dark + playful type, mobile first, large touch targets; Home, Create, Join, Lobby, Gameplay, Results, Profile (guest / registered), Admin content.
- AC: WCAG 2.1 AA (axe), works at 360 px width, round number / timer / players' status / score always visible during play.

## R8 Platform rules kept

- Server-authoritative, RLS on every exposed table, private schema not exposed, idempotent commands, rate limits, append-only migrations, `pnpm check` + CI gate.

## Post-MVP (not built)

Ranked + seasons + matchmaking rating, XP / levels / missions / achievements, collection, shop, VIP host, payments, leaderboard, English locale, bots in BLUFF (Q7 = no bots in MVP).
