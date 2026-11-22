// POST { action, ...params } → admin data. Every call: session + super_admin role + MFA (aal2),
// checked server-side in requireAdmin. Mutations are audited. Catalog data is read-only
// (owner decision 2026-11-20: rule changes go through the spec + PR, not the dashboard).
import { createSeededRandom, discard, ENGINE_VERSION, RULESET_VERSION } from "@aummon/game-engine";
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
      select r.id, r.mode, r.status, r.created_at, r.expires_at, players, m.id as match_id, m.status as match_status, last_activity,
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

const actions: Record<string, Action> = {
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
      select m.id, m.status, m.phase, m.round_number as turn, m.ruleset_version, m.started_at, m.finished_at, r.mode,
             (select json_agg(json_build_object('seat', mp.seat, 'type', mp.player_type, 'cards', mp.hand_count) order by mp.seat)
                from public.match_players mp where mp.match_id = m.id) as players
      from public.matches m join public.game_rooms r on r.id = m.room_id
      where m.status = ${status} order by m.created_at desc limit ${limit(body)}`;
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

  /** Bot-vs-bot simulation in memory (no data written). Development only. */
  "bots.simulate": async (admin, body) => {
    if (appEnv() !== "development")
      throw new HttpError(403, "dev_only", "Development tools are disabled here");
    const games = Math.min(Math.max(Number(body["games"] ?? 10) || 10, 1), 50);
    const players = Math.min(Math.max(Number(body["players"] ?? 4) || 4, 2), 8);
    const wins: number[] = Array.from({ length: players }, () => 0);
    let turns = 0;
    for (let g = 0; g < games; g++) {
      const seed = crypto.getRandomValues(new Uint32Array(4));
      const rng = createSeededRandom([
        (seed[0] ?? 0) === 0 ? 1 : (seed[0] ?? 1),
        seed[1] ?? 0,
        seed[2] ?? 0,
        seed[3] ?? 0,
      ]);
      let { state: s } = discard.startGame(
        Array.from({ length: players }, (_, i) => `p${String(i)}`),
        rng,
      );
      for (let n = 0; n < 3000 && s.status === "active"; n++) {
        const seat = discard.actingSeat(s) ?? 0;
        s = discard.applyCommand(s, discard.chooseBotCommand(s, seat, rng), rng).state;
      }
      turns += s.turnNumber;
      if (s.winner !== null) wins[s.winner] = (wins[s.winner] ?? 0) + 1;
    }
    await db().begin((tx) => audit(tx, admin, "bots.simulated", null, null, { games, players }));
    return { games, players, winsBySeat: wins, avgTurns: Math.round(turns / games) };
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
