# AumMon — Security Review (task 7.1)

Date: 2026-11-20 · Scope: Dev (`AumMon-Dev`) + Vercel Preview · Reviewer: Claude (automated + manual)

| Area           | Check                                                                                                               | Result | Evidence                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Secrets        | No secret/service-role key in Git or client bundle                                                                  | ✅     | `pnpm check:secrets` in CI; deployed bundle contains only `sb_publishable_` |
| Secrets        | Server credentials only in Supabase function env / environment secrets                                              | ✅     | `SUPABASE_DB_URL` etc. injected by Edge Runtime                             |
| Database       | RLS on every `public` table; least-privilege grants; `private` not exposed                                          | ✅     | pgTAP 001–007 (121 tests); cloud check: `db_schema = public,graphql_public` |
| Database       | SECURITY DEFINER functions: empty `search_path`, schema-qualified, EXECUTE restricted                               | ✅     | pgTAP 002, 004                                                              |
| Game integrity | Server-authoritative engine; client sends intent only; forbidden fields rejected                                    | ✅     | backend tests (forged `hp` → 400)                                           |
| Game integrity | Idempotency, version checks, single resolver (row lock)                                                             | ✅     | backend concurrency tests                                                   |
| Privacy        | Hands/deck/RNG/skill state never in API, events or Realtime                                                         | ✅     | engine view tests, backend leak checks, publication test                    |
| Realtime       | Postgres Changes filtered by RLS; private `match:<id>` channel members-only                                         | ✅     | backend online tests                                                        |
| Abuse          | Rate limits: room create 10/min, join 10/min, submit 60/min, match reads 240/min; join codes hashed + 30 min expiry | ✅     | `_shared/ratelimit.ts`, backend 429 test                                    |
| Abuse          | Sign-up/login rate limits                                                                                           | ✅     | Supabase Auth built-in limits                                               |
| Web            | CORS allow-list (`*-aum-mon.vercel.app`, localhost)                                                                 | ✅     | `origins.ts` tests; cloud preflight check                                   |
| Web            | CSP, HSTS, X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy, noindex                   | ✅     | `vercel.json`; verified on deployed preview                                 |
| Web            | XSS: React escaping, no `dangerouslySetInnerHTML`, validated names                                                  | ✅     | code search; name regex server-side                                         |
| Logging        | Errors logged without stack/state/secrets; clients get generic `internal_error`                                     | ✅     | `_shared/http.ts`                                                           |
| Dependencies   | `pnpm audit`                                                                                                        | ✅     | no known vulnerabilities (2026-11-20)                                       |

## Open items (must be closed before production — task 7.8)

1. **Email confirmation** is OFF on `AumMon-Dev` for playtesting (owner-approved); production must keep it ON with a real SMTP provider.
2. **Vercel Authentication** is OFF for previews (owner choice); production URL decision pending.
3. ~~Pass & Play privacy on a shared device~~ — mode removed 2026-11-22 (task 12.10).
4. **Timeouts are lazy** (applied on the next request); a fully idle online match pauses until someone reconnects — acceptable, not a security issue.
5. Production project, secrets rotation and backups are covered by 6.8 / 7.3.

## Game Center update (GC8.3, 2026-11-23)

Scope: Phase 14 changes (game registry, Dummy, Poker, Quick Match, per-game stats, admin game switches). Reviewer: Claude (code review + tests).

| Area               | Check                                                                                                                                                                                                                          | Result | Evidence                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------ |
| Game selection     | Game module chosen from `matches.game_id` in the DB, never from client input; unknown / disabled games → 404                                                                                                                   | ✅     | `_shared/game.ts` `lockGame`, `enabledGame`; backend `game-center.test.ts`                 |
| Hidden information | Dummy hands / stock and Poker hole cards / deck stay in `private.match_runtime`; views expose only the caller's cards; public events carry no hidden card (Dummy `drew` has no card; Poker hole cards only in public showdown) | ✅     | engine view tests, backend tests (`"hand"` / `"hole"` never in responses)                  |
| Bots               | Dummy and Poker bots decide from the seat view only (cannot read other hands or the deck)                                                                                                                                      | ✅     | `dummy/bot.ts`, `poker/bot.ts` use `get*View(state, seat)`                                 |
| Input              | Each game parses intent strictly (card codes, integer amounts, bounded arrays); rule errors → 409, malformed → 400                                                                                                             | ✅     | `parseDummyCommand`, `parsePokerCommand`, unit tests                                       |
| Matchmaking        | Authenticated, rate-limited (join 20/min, status 120/min), serialised per (game, size) with an advisory lock; queue in `private`                                                                                               | ✅     | `_shared/matchmaking.ts`, pgTAP 014, backend pairing test                                  |
| Realtime           | Lobby moved to private `room:{uuid}` topic authorised by `is_room_member` (was a public topic, audit S3)                                                                                                                       | ✅     | migration `20261123000100`, E2E online                                                     |
| Stats              | `player_game_stats` RLS: owner reads own rows; writes only by service role                                                                                                                                                     | ✅     | pgTAP 014                                                                                  |
| Registry           | `public.games` readable only for enabled rows; only admins (MFA) change it, audited                                                                                                                                            | ✅     | pgTAP 013, backend admin test                                                              |
| Auth coverage      | Every Edge Function calls `requireUser` / `requireAdmin` (verify_jwt is off by design)                                                                                                                                         | ✅     | `tests/architecture/game-modules.test.ts`                                                  |
| Play money         | Poker chips exist only inside a match (no balance, purchase, transfer or cash-out)                                                                                                                                             | ✅     | `docs/games/poker/POKER_RULES.md`; legal check still required before public launch (GC9.2) |

No new high or medium findings. Open: audit S1 (banned users' existing tokens) still needs verification against Supabase behaviour.
