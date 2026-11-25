// POST { action, ...params } → admin data. Every call: session + super_admin role + MFA (aal2),
// checked server-side in requireAdmin. Mutations are audited. Catalog data is read-only
// (owner decision 2026-11-20: rule changes go through the spec + PR, not the dashboard).
import {
  createSeededRandom,
  discard,
  ENGINE_VERSION,
  getGameModule,
  isGameId,
  RULESET_VERSION,
} from "@aummon/game-engine";
import { appEnv, audit, authAdmin, requireAdmin, type AdminContext } from "../_shared/admin.ts";
import { db } from "../_shared/db.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { validateSoundConfig } from "../_shared/sound-schema.ts";
import type { Tx } from "../_shared/store.ts";

type Body = Record<string, unknown>;

/** Why an open room is stale (or null). Idle = no game event / creation for 2 hours. */
function roomsQuery(sql: Tx | ReturnType<typeof db> = db()) {
  return sql`
    select * from (
      select r.id, r.game_id, r.mode, r.status, r.created_at, r.expires_at, players, m.id as match_id, m.status as match_status, last_activity,
        case
          when players = 0 then 'empty'
          when r.status = 'lobby' and r.expires_at is not null and r.expires_at < now() then 'expired'
          when r.status = 'playing' and (m.id is null or m.status <> 'active') then 'finished'
          when last_activity < now() - interval '2 hours' then 'idle'
        end as stale_reason
      from public.game_rooms r
      cross join lateral (select count(*)::int as players from public.room_players rp
                          where rp.room_id = r.id and rp.status <> 'left') pc
      left join lateral (select id, status, started_at from public.matches where room_id = r.id
                         order by created_at desc limit 1) m on true
      cross join lateral (select coalesce(
          (select max(e.created_at) from public.match_events e where e.match_id = m.id),
          m.started_at, r.created_at) as last_activity) la
      where r.status in ('lobby','playing')
    ) q`;
}

async function closeRoom(tx: Tx, roomId: string): Promise<Record<string, unknown> | null> {
  const rows = await tx<{ id: string }[]>`
    update public.game_rooms set status = 'closed' where id = ${roomId} and status in ('lobby','playing') returning id`;
  if (rows.length === 0) return null;
  const abandoned = await tx`
    update public.matches set status = 'abandoned', finished_at = now()
    where room_id = ${roomId} and status = 'active' returning id`;
  return { abandonedMatches: abandoned.length };
}
type Action = (admin: AdminContext, body: Body) => Promise<unknown>;

const limit = (body: Body, max = 100) => {
  const n = Number(body["limit"] ?? 50);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : 50;
};

/** Optional game filter for listings (null = all games). */
const gameFilter = (body: Body): string | null => {
  const v = body["gameId"];
  // Retired games (Dummy, Poker) stay filterable in history.
  return typeof v === "string" && /^[a-z_]{2,32}$/.test(v) ? v : null;
};

const actions: Record<string, Action> = {
  /** Game Center registry with live counts per game (GC7.1). */
  games: async () =>
    db()`
      select g.id, g.display_name_th, g.display_name_en, g.is_enabled, g.min_players, g.max_players,
             g.current_ruleset, g.sort_order,
             (select count(*)::int from public.matches m where m.game_id = g.id and m.status = 'active') as active_matches,
             (select count(*)::int from public.matches m where m.game_id = g.id and m.status = 'finished'
                and m.finished_at > now() - interval '24 hours') as finished_24h,
             (select count(*)::int from public.player_game_stats s where s.game_id = g.id) as players
      from public.games g order by g.sort_order`,

  /** Turn a game on/off for players (running matches finish normally; new ones are refused). */
  "game.set_enabled": async (admin, body) => {
    const gameId = body["gameId"];
    const enabled = body["enabled"] === true;
    // Any registered row may be turned off; only games with a module may be turned on (retired ones stay off).
    if (
      typeof gameId !== "string" ||
      !/^[a-z_]{2,32}$/.test(gameId) ||
      (enabled && !isGameId(gameId))
    )
      throw new HttpError(400, "invalid_input", "gameId invalid");
    return db().begin(async (tx) => {
      const rows = await tx`update public.games set is_enabled = ${enabled}, updated_at = now()
        where id = ${gameId} returning id`;
      if (rows.length === 0) throw new HttpError(404, "not_found", "Game not found");
      await audit(tx, admin, enabled ? "game.enabled" : "game.disabled", "game", gameId);
      return { ok: true };
    });
  },

  me: (admin) =>
    Promise.resolve({ userId: admin.userId, role: admin.role, aal: admin.aal, env: appEnv() }),

  overview: async () => {
    const [counts] = await db()<
      { players: number; active_rooms: number; active_matches: number; finished_24h: number }[]
    >`
      select
        (select count(*)::int from public.profiles) as players,
        (select count(*)::int from public.game_rooms where status in ('lobby','playing')) as active_rooms,
        (select count(*)::int from public.matches where status = 'active') as active_matches,
        (select count(*)::int from public.matches where status = 'finished' and finished_at > now() - interval '24 hours') as finished_24h,
        -- Signed-in users whose session was used/refreshed in the last hour (access tokens refresh hourly).
        (select count(distinct user_id)::int from auth.sessions
           where coalesce(refreshed_at, updated_at, created_at) > now() - interval '1 hour'
             and (not_after is null or not_after > now())) as online_now`;
    const events = await db()`
      select e.match_id, e.event_type, e.public_payload, e.created_at from public.match_events e
      order by e.id desc limit 10`;
    const [errors] = await db()<{ errors: number; requests: number }[]>`
      select count(*) filter (where status >= 500)::int as errors, count(*)::int as requests
      from private.function_metrics where created_at > now() - interval '1 hour'`;
    return {
      counts,
      recentEvents: events,
      system: {
        env: appEnv(),
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        db: "ok",
        lastHour: errors,
      },
    };
  },

  players: async (_a, body) => {
    const q = typeof body["query"] === "string" ? body["query"].trim().slice(0, 64) : "";
    const pattern = `%${q.replace(/[%_\\]/g, "")}%`;
    return db()`
      select p.id, p.display_name, u.email, p.created_at, u.last_sign_in_at,
             (u.banned_until is not null and u.banned_until > now()) as disabled,
             exists (select 1 from private.admin_roles r where r.user_id = p.id) as is_admin,
             (select count(*)::int from public.match_players mp where mp.user_id = p.id) as matches
      from public.profiles p join auth.users u on u.id = p.id
      where ${q === ""} or p.display_name ilike ${pattern} or u.email ilike ${pattern}
      order by p.created_at desc limit ${limit(body)}`;
  },

  "player.set_disabled": async (admin, body) => {
    const userId = uuid(body, "userId");
    const disabled = body["disabled"] === true;
    if (userId === admin.userId)
      throw new HttpError(409, "cannot_disable_self", "Cannot disable your own account");
    const [target] = await db()`select 1 from private.admin_roles where user_id = ${userId}`;
    if (target) throw new HttpError(409, "target_is_admin", "Revoke admin first (SQL bootstrap)");
    await authAdmin(`users/${userId}`, "PUT", { ban_duration: disabled ? "876000h" : "none" });
    await db().begin((tx) =>
      audit(tx, admin, disabled ? "player.disabled" : "player.enabled", "user", userId),
    );
    return { ok: true };
  },

  /**
   * Playtest stats (task 12.16, Playtest Protocol §4–§5): aggregates of private.round_stats for the
   * current ruleset — no names, no user ids, no hands are returned.
   */
  stats: async () => {
    const rows = await db()<
      {
        players: number;
        humans: number;
        seconds: number;
        turns: number;
        timeouts: number;
        decisions: number;
        decision_ms: string;
        drawn_plays: number;
        rematch: boolean;
        left_early: number;
        winner_seat: number | null;
        opening: string[][];
      }[]
    >`
      select players, humans, extract(epoch from (finished_at - started_at))::int as seconds,
             turns, timeouts, decisions, decision_ms, drawn_plays, rematch, left_early,
             winner_seat, opening
      from private.round_stats
      where ruleset_version = ${RULESET_VERSION} and finished_at is not null
      order by started_at desc limit 2000`;
    const median = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s.length === 0 ? null : (s[Math.floor(s.length / 2)] ?? null);
    };
    const byPlayers = [2, 3, 4, 5, 6, 7, 8].map((n) => {
      const rs = rows.filter((r) => r.players === n);
      const humanRounds = rs.reduce((a, r) => a + r.humans, 0);
      return {
        players: n,
        rounds: rs.length,
        medianMinutes: rs.length ? (median(rs.map((r) => r.seconds)) ?? 0) / 60 : null,
        over15Pct: rs.length ? (rs.filter((r) => r.seconds > 900).length / rs.length) * 100 : null,
        timeoutsPerHumanRound: humanRounds
          ? rs.reduce((a, r) => a + r.timeouts, 0) / humanRounds
          : null,
        rematchPct: rs.length ? (rs.filter((r) => r.rematch).length / rs.length) * 100 : null,
      };
    });
    const decisions = rows.reduce((a, r) => a + r.decisions, 0);
    const cards = discard.DISCARD_CARDS.map((c) => {
      let had = 0;
      let won = 0;
      let fair = 0;
      for (const r of rows)
        r.opening.forEach((hand, seat) => {
          if (hand.includes(c.cardId)) {
            had++;
            fair += 1 / r.players;
            if (r.winner_seat === seat) won++;
          }
        });
      return { name: c.name, winIndex: fair > 0 ? won / fair : null, rounds: had };
    });
    return {
      rulesetVersion: RULESET_VERSION,
      rounds: rows.length,
      byPlayers,
      avgDecisionSeconds: decisions
        ? rows.reduce((a, r) => a + Number(r.decision_ms), 0) / decisions / 1000
        : null,
      drawnPlaysPerRound: rows.length
        ? rows.reduce((a, r) => a + r.drawn_plays, 0) / rows.length
        : null,
      leftEarlyPct: rows.length
        ? (rows.filter((r) => r.left_early > 0).length / rows.length) * 100
        : null,
      cards,
    };
  },

  /** Card list from the engine data (cards are no longer stored in the database). */
  cards: () =>
    Promise.resolve({ cards: discard.DISCARD_CARDS, copies: discard.DISCARD_RULES.copies }),

  /** Open rooms with a server-computed `stale_reason` (null = healthy). */
  rooms: async (_a, body) =>
    db()`${roomsQuery()} order by stale_reason is null, created_at desc limit ${limit(body)}`,

  /** Close one room (lobby or playing). An unfinished game in it is abandoned first. */
  "room.close": async (admin, body) => {
    const roomId = uuid(body, "roomId");
    return db().begin(async (tx) => {
      const closed = await closeRoom(tx, roomId);
      if (!closed) throw new HttpError(409, "not_closable", "Room is already closed");
      await audit(tx, admin, "room.closed", "room", roomId, closed);
      return { ok: true };
    });
  },

  /** Close every stale room at once (expired, empty, finished or idle > 2 h). */
  "rooms.close_stale": async (admin) =>
    db().begin(async (tx) => {
      const stale = await tx<{ id: string }[]>`
        select id from (${roomsQuery(tx)}) s where stale_reason is not null`;
      for (const r of stale) await closeRoom(tx, r.id);
      await audit(tx, admin, "rooms.closed_stale", null, null, { count: stale.length });
      return { closed: stale.length };
    }),

  matches: async (_a, body) => {
    const status = body["status"] === "finished" ? "finished" : "active";
    return db()`
      select m.id, m.game_id, m.status, m.phase, m.round_number as turn, m.ruleset_version, m.started_at, m.finished_at, r.mode,
             (select json_agg(json_build_object('seat', mp.seat, 'type', mp.player_type, 'cards', mp.hand_count) order by mp.seat)
                from public.match_players mp where mp.match_id = m.id) as players
      from public.matches m join public.game_rooms r on r.id = m.room_id
      where m.status = ${status} and (${gameFilter(body)}::text is null or m.game_id = ${gameFilter(body)})
      order by m.created_at desc limit ${limit(body)}`;
  },

  /** Public information only (no hands, deck order or RNG) — no impersonation of players. */
  "match.view": async (_a, body) => {
    const matchId = uuid(body, "matchId");
    const [match] =
      await db()`select id, status, phase, round_number, ruleset_version, started_at from public.matches where id = ${matchId}`;
    if (!match) throw new HttpError(404, "not_found", "Match not found");
    const players =
      await db()`select seat, player_type, hand_count, status from public.match_players where match_id = ${matchId} order by seat`;
    const events =
      await db()`select event_seq, round_number, event_type, public_payload from public.match_events where match_id = ${matchId} order by event_seq desc limit 100`;
    return { match, players, events };
  },

  "match.abandon": async (admin, body) => {
    const matchId = uuid(body, "matchId");
    return db().begin(async (tx) => {
      const rows = await tx`
        update public.matches set status = 'abandoned', finished_at = now()
        where id = ${matchId} and status = 'active' returning room_id`;
      const room = rows[0] as { room_id: string } | undefined;
      if (!room) throw new HttpError(409, "not_active", "Match is not active");
      await tx`update public.game_rooms set status = 'closed' where id = ${room.room_id}`;
      await audit(tx, admin, "match.abandoned", "match", matchId);
      return { ok: true };
    });
  },

  /** Bot-vs-bot simulation in memory for any game (no data written). Development only. */
  "bots.simulate": async (admin, body) => {
    if (appEnv() !== "development")
      throw new HttpError(403, "dev_only", "Development tools are disabled here");
    const gameId = isGameId(body["gameId"]) ? body["gameId"] : "edo_battle";
    const game = getGameModule(gameId);
    const games = Math.min(Math.max(Number(body["games"] ?? 10) || 10, 1), 50);
    const players = Math.min(
      Math.max(Number(body["players"] ?? 4) || 4, game.minPlayers),
      game.maxPlayers,
    );
    const wins: number[] = Array.from({ length: players }, () => 0);
    let rounds = 0;
    for (let g = 0; g < games; g++) {
      const seed = crypto.getRandomValues(new Uint32Array(4));
      const rng = createSeededRandom([
        (seed[0] ?? 0) === 0 ? 1 : (seed[0] ?? 1),
        seed[1] ?? 0,
        seed[2] ?? 0,
        seed[3] ?? 0,
      ]);
      let { state: s } = game.start(
        Array.from({ length: players }, (_, i) => `p${String(i)}`),
        rng,
      );
      for (let n = 0; n < 20_000 && !game.isFinished(s); n++) {
        const seat = game.actingSeat(s) ?? 0;
        s = game.apply(s, seat, game.bot(s, seat, rng), rng).state;
      }
      rounds += game.round(s);
      for (const w of game.result(s)?.winners ?? []) wins[w] = (wins[w] ?? 0) + 1;
    }
    await db().begin((tx) =>
      audit(tx, admin, "bots.simulated", "game", gameId, { games, players }),
    );
    return { gameId, games, players, winsBySeat: wins, avgTurns: Math.round(rounds / games) };
  },

  "sounds.get": async () => {
    const [row] = await db()<{ value: unknown; updated_at: string }[]>`
      select value, updated_at from public.game_settings where key = 'sounds'`;
    return { value: row?.value ?? null, updatedAt: row?.updated_at ?? null };
  },

  /** Global sound settings for every player (validated + audited). */
  "sounds.set": async (admin, body) => {
    const value = validateSoundConfig(body["value"]);
    if (!value) throw new HttpError(400, "invalid_sounds", "Invalid sound settings");
    return db().begin(async (tx) => {
      await tx`
        insert into public.game_settings (key, value, updated_by) values ('sounds', ${tx.json(value)}, ${admin.userId})
        on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
      await audit(tx, admin, "settings.sounds_updated", "setting", "sounds");
      return { ok: true };
    });
  },

  "logs.game": async (_a, body) =>
    db()`select match_id, event_seq, round_number, event_type, public_payload, created_at from public.match_events order by id desc limit ${limit(body, 200)}`,

  "logs.security": async (_a, body) => ({
    audit:
      await db()`select a.id, coalesce(p.display_name, 'ระบบ') as actor, a.action, a.target_type, a.target_id, a.details, a.created_at from private.admin_audit_log a left join public.profiles p on p.id = a.actor_user_id order by a.id desc limit ${limit(body, 200)}`,
    rejected: await db()`
      select function_name, status, error_code, created_at from private.function_metrics
      where status in (401, 403, 429) or status >= 500 order by id desc limit ${limit(body, 200)}`,
  }),

  health: async () => ({
    functions: await db()`select * from private.metrics_functions_24h order by requests desc`,
    matchesDaily: await db()`select * from private.metrics_matches_daily limit 7`,
    tables: await db()`
      select relname as table, n_live_tup::int as rows from pg_stat_user_tables
      where schemaname in ('public','private') order by n_live_tup desc limit 30`,
    db: (await db()`select version() as version, now() as now`)[0],
  }),

  settings: () =>
    Promise.resolve({
      env: appEnv(),
      engineVersion: ENGINE_VERSION,
      rulesetVersion: RULESET_VERSION,
      turnTimeoutMs: discard.DISCARD_RULES.turnTimeoutMs,
      devToolsEnabled: appEnv() === "development",
      mfaRequired: true,
    }),
};

Deno.serve(
  handler(async (request) => {
    const body = await readJson(request);
    const name = typeof body["action"] === "string" ? body["action"] : "";
    const action = Object.hasOwn(actions, name) ? actions[name] : undefined;
    if (!action) throw new HttpError(400, "unknown_action", "Unknown admin action");
    const admin = await requireAdmin(request, name === "me");
    await rateLimit(admin.userId, "admin", 300, 60);
    return action(admin, body);
  }),
);
