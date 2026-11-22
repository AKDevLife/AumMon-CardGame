/**
 * Casual Discard Edition server adapter (2–8 seats): create/start, lock → advance (bots,
 * timers) → command → advance → save, and per-seat views. Clients send intent only;
 * hands stay private (Magnifier peeks reach only the peeking seat).
 */
import {
  createSeededRandom,
  discard,
  ENGINE_VERSION,
  RULESET_VERSION,
  type RngState,
} from "@aummon/game-engine";
import { db } from "./db.ts";
import { HttpError } from "./http.ts";
import { rateLimit } from "./ratelimit.ts";
import { findReceipt, storeReceipt } from "./receipts.ts";
import { decodeRng, encodeRng, type Tx } from "./store.ts";
import {
  actingSeat,
  advanceGame,
  deadlineAfterAct,
  effectiveKinds,
  GRACE_MS,
  type GameRuntime,
  type Kind,
  type Mode,
} from "./game-flow.ts";

interface SeatRow {
  id: string;
  seat: number;
  player_type: Kind;
  user_id: string | null;
  room_player_id: string | null;
  display_name: string;
}

interface Locked extends GameRuntime {
  matchId: string;
  roomId: string;
  status: string;
  userId: string;
  ownerId: string;
  mode: Mode;
  version: number;
  seats: SeatRow[];
  /** Runtime changed outside the engine (e.g. resume) — save even without events. */
  dirty?: boolean;
}

/** DB seats are 1-based; engine seats are 0-based. */
const toEngine = (seat: number) => seat - 1;

function cryptoSeed(): RngState {
  const s = crypto.getRandomValues(new Uint32Array(4));
  if (s.every((v) => v === 0)) s[0] = 1;
  return [s[0] ?? 1, s[1] ?? 0, s[2] ?? 0, s[3] ?? 0];
}

// ---------------------------------------------------------------- persistence

async function lockGame(tx: Tx, matchId: string, userId: string): Promise<Locked> {
  const lock =
    await tx`select id from public.matches where id = ${matchId} and ruleset_version = '13' for update`;
  if (lock.length === 0) throw new HttpError(404, "not_found", "Match not found");
  const [row] = await tx<
    {
      owner_id: string;
      room_id: string;
      status: string;
      seat_timeouts: number[];
      mode: Mode;
      version: string;
      internal_state: discard.GameState;
      rng_state: Uint8Array;
      phase_deadline: Date | null;
    }[]
  >`
    select r.owner_id, m.room_id, m.status, rt.seat_timeouts, r.mode, m.version, rt.internal_state, rt.rng_state, rt.phase_deadline
    from public.matches m
    join public.game_rooms r on r.id = m.room_id
    join private.match_runtime rt on rt.match_id = m.id
    where m.id = ${matchId}`;
  if (!row) throw new HttpError(404, "not_found", "Match not found");
  const seats = await tx<SeatRow[]>`
    select mp.id, mp.seat, mp.player_type, mp.user_id, mp.room_player_id,
           coalesce(rp.display_name_snapshot, 'Player') as display_name
    from public.match_players mp left join public.room_players rp on rp.id = mp.room_player_id
    where mp.match_id = ${matchId} order by mp.seat`;
  if (!seats.some((s) => s.user_id === userId) && row.owner_id !== userId)
    throw new HttpError(404, "not_found", "Match not found");
  return {
    matchId,
    userId,
    ownerId: row.owner_id,
    roomId: row.room_id,
    status: row.status,
    timeouts: row.seat_timeouts,
    mode: row.mode,
    version: Number(row.version),
    seats,
    state: row.internal_state,
    rng: decodeRng(row.rng_state),
    deadline: row.phase_deadline ? row.phase_deadline.getTime() : null,
  };
}

async function saveGame(
  tx: Tx,
  locked: Locked,
  rt: GameRuntime,
  events: discard.GameEvent[],
): Promise<number> {
  const { state } = rt;
  const finished = state.status === "finished";
  const version = locked.version + 1;
  const phase = finished ? "finished" : state.reactions.length > 0 ? "reaction" : "play";
  await tx`
    update public.matches set
      phase = ${phase}, round_number = ${state.turnNumber}, version = ${version},
      status = ${finished ? "finished" : "active"}, finished_at = ${finished ? tx`now()` : null}
    where id = ${locked.matchId}`;
  for (const s of locked.seats) {
    const seat = toEngine(s.seat);
    const status = state.winner === seat ? "won" : "playing";
    await tx`update public.match_players
      set hand_count = ${state.players[seat]?.hand.length ?? 0}, status = ${status}, player_type = ${s.player_type}
      where id = ${s.id} and match_id = ${locked.matchId}`;
  }
  await tx`
    update private.match_runtime set internal_state = ${tx.json(state as never)},
      rng_state = ${encodeRng(rt.rng)}, seat_timeouts = ${rt.timeouts}, phase_deadline = ${rt.deadline === null ? null : new Date(rt.deadline)}
    where match_id = ${locked.matchId}`;
  if (events.length > 0) {
    const [seq] = await tx<{ next: string }[]>`
      select coalesce(max(event_seq), 0) + 1 as next from public.match_events where match_id = ${locked.matchId}`;
    const rows = events.map((e, i) => ({
      match_id: locked.matchId,
      event_seq: Number(seq?.next ?? 1) + i,
      round_number: state.turnNumber,
      event_type: e.type,
      // Private peeks are stored without the cards; the peeking seat gets them in its response only.
      public_payload: e.type === "peek" ? { type: "peek", seat: e.seat, target: e.target } : e,
    }));
    await tx`insert into public.match_events ${tx(rows as never)}`;
  }
  await recordStats(tx, locked, state, events);
  if (finished) {
    if (locked.mode === "online") {
      // Online (owner 2026-11-22): back to the lobby; everyone except the owner must press ready
      // again before the owner can start the next round. Players who left stay out.
      await tx`update public.game_rooms set status = 'lobby', expires_at = now() + interval '30 minutes'
        where id = ${locked.roomId}`;
      await tx`update public.room_players set status = case when user_id = ${locked.ownerId} then 'ready' else 'waiting' end
        where room_id = ${locked.roomId} and status <> 'left'`;
    } else await tx`update public.game_rooms set status = 'closed' where id = ${locked.roomId}`;
  }
  return version;
}

// ---------------------------------------------------------------- telemetry (private, aggregate only)

/** Adds this save's events to private.round_stats (task 12.16). */
async function recordStats(
  tx: Tx,
  locked: Locked,
  state: discard.GameState,
  events: readonly discard.GameEvent[],
): Promise<void> {
  const abilities: Record<string, number> = {};
  for (const e of events)
    if (e.type === "ability") abilities[e.ability] = (abilities[e.ability] ?? 0) + 1;
  const timeouts = events.filter((e) => e.type === "timeout").length;
  const finished = state.status === "finished";
  const winnerKind =
    state.winner === null
      ? null
      : (locked.seats.find((x) => toEngine(x.seat) === state.winner)?.player_type ?? null);
  await tx`
    update private.round_stats set
      turns = ${state.turnNumber},
      timeouts = timeouts + ${timeouts},
      abilities = abilities || coalesce((
        select jsonb_object_agg(n.key, n.value::int + coalesce((round_stats.abilities ->> n.key)::int, 0))
        from jsonb_each_text(${tx.json(abilities)}::jsonb) n), '{}'::jsonb),
      finished_at = ${finished ? tx`now()` : null},
      winner_seat = ${state.winner},
      winner_kind = ${winnerKind}
    where match_id = ${locked.matchId}`;
}

// ---------------------------------------------------------------- views

/** Seat the caller controls (own seat). */
function actorSeat(locked: Locked): number | null {
  const own = locked.seats.find((s) => s.user_id === locked.userId);
  return own ? toEngine(own.seat) : null;
}

export interface GameResponse {
  matchId: string;
  rulesetVersion: "13";
  mode: Mode;
  version: number;
  deadline: string | null;
  /** Caller's seat; null = spectator / not seated. */
  seat: number | null;
  acting: number | null;
  botActing: boolean;
  names: string[];
  view: discard.SeatView;
  events: unknown[];
  /** Cards the caller saw with Magnifier during this request (private). */
  peeks: { target: number | null; cards: string[] }[];
  /** Server clock (ms) so the client can correct its countdown; the client never decides time. */
  serverNow: number;
  /** Seats the server is playing because of repeated timeouts (Online). */
  autoSeats: number[];
  /** Finished match: the rematch in the same room, once someone started it. */
  nextMatchId: string | null;
  /** Room of this match (Online: the lobby to go back to for the next round). */
  roomId: string;
}

async function respondGame(
  tx: Tx,
  locked: Locked,
  rt: GameRuntime,
  version: number,
  fresh: readonly discard.GameEvent[],
): Promise<GameResponse> {
  const { state } = rt;
  const acting = actingSeat(state);
  const seat = actorSeat(locked);
  const events = await tx<{ public_payload: unknown }[]>`
    select public_payload from public.match_events where match_id = ${locked.matchId}
    order by event_seq desc limit 60`;
  const kinds = effectiveKinds(kindsOf(locked), rt.timeouts, locked.mode);
  const [next] =
    state.status === "finished"
      ? await tx<{ id: string }[]>`
          select id from public.matches where room_id = ${locked.roomId} and id <> ${locked.matchId}
            and created_at > (select created_at from public.matches where id = ${locked.matchId})
          order by created_at desc limit 1`
      : [];
  return {
    matchId: locked.matchId,
    rulesetVersion: "13",
    mode: locked.mode,
    version,
    deadline: rt.deadline === null ? null : new Date(rt.deadline).toISOString(),
    seat,
    acting,
    botActing: acting !== null && kinds[acting] === "bot",
    names: [...locked.seats].sort((a, b) => a.seat - b.seat).map((s) => s.display_name),
    view: discard.getView(state, seat),
    events: events.map((e) => e.public_payload).reverse(),
    peeks: fresh.flatMap((e) =>
      e.type === "peek" && e.seat === seat ? [{ target: e.target, cards: e.cards }] : [],
    ),
    serverNow: Date.now(),
    autoSeats: kinds.flatMap((k, i) => (k === "bot" && kindsOf(locked)[i] === "human" ? [i] : [])),
    nextMatchId: next?.id ?? null,
    roomId: locked.roomId,
  };
}

// ---------------------------------------------------------------- use cases

const kindsOf = (locked: Locked): Kind[] =>
  [...locked.seats].sort((a, b) => a.seat - b.seat).map((s) => s.player_type);

/** Load, apply due bots/timeouts, optionally run `act`, save, respond. */
export async function withGame(
  userId: string,
  matchId: string,
  options: {
    act?: (
      state: discard.GameState,
      seat: number,
      rng: ReturnType<typeof createSeededRandom>,
    ) => discard.Transition;
    expectedVersion?: number;
    receipt?: { key: string; hash: string };
    /** Online auto-play: the player is back — clear their timeout streak. */
    resume?: boolean;
  } = {},
): Promise<unknown> {
  await rateLimit(userId, "match.read", 240, 60);
  return db().begin(async (tx) => {
    const locked = await lockGame(tx, matchId, userId);
    if (options.receipt) {
      const previous = await findReceipt(
        tx,
        matchId,
        userId,
        options.receipt.key,
        options.receipt.hash,
      );
      if (previous !== undefined) return previous;
    }
    const now = Date.now();
    const kinds = kindsOf(locked);
    const own = actorSeat(locked);
    if (options.resume && own !== null && (locked.timeouts[own] ?? 0) > 0) {
      locked.timeouts = locked.state.players.map((_, i) =>
        i === own ? 0 : (locked.timeouts[i] ?? 0),
      );
      locked.dirty = true;
    }
    // A command that reached the server within the grace window still beats the timeout.
    let rt = advanceGame(locked, kinds, options.act ? now - GRACE_MS : now, locked.mode);
    const events = [...rt.events];
    if (options.act) {
      if (options.expectedVersion !== undefined && options.expectedVersion !== locked.version)
        throw new HttpError(409, "stale_version", "State changed; refresh and retry");
      const seat = actorSeat(locked);
      if (seat === null) throw new HttpError(403, "not_your_turn", "You cannot act now");
      const rng = createSeededRandom(rt.rng);
      let t: discard.Transition;
      try {
        t = options.act(rt.state, seat, rng);
      } catch (e) {
        if (e instanceof discard.CommandError) throw new HttpError(409, e.code, e.code);
        throw e;
      }
      events.push(...t.events);
      // Telemetry: decision time of this human action (from the start of the turn timer).
      const startedAt =
        rt.deadline === null ? null : rt.deadline - discard.DISCARD_RULES.turnTimeoutMs;
      const drawnPlay =
        rt.state.drawn?.seat === seat &&
        t.events.some((e) => e.type === "played" && e.seat === seat);
      await tx`
        update private.round_stats set decisions = decisions + 1,
          decision_ms = decision_ms + ${startedAt === null ? 0 : Math.max(0, Math.min(now - startedAt, 60_000))},
          drawn_plays = drawn_plays + ${drawnPlay ? 1 : 0}
        where match_id = ${locked.matchId}`;
      // Acting resets this seat's timeout streak (and ends auto-play).
      const timeouts = rt.timeouts.map((x, i) => (i === seat ? 0 : x));
      const after = advanceGame(
        {
          state: t.state,
          rng: rng.getState(),
          // Each turn gets its own full timer (owner report: the timer carried over to the next player).
          deadline: deadlineAfterAct(rt.state, t.state, rt.deadline),
          timeouts,
        },
        kinds,
        now,
        locked.mode,
      );
      events.push(...after.events);
      rt = after;
    }
    const changed =
      events.length > 0 ||
      rt.deadline !== locked.deadline ||
      rt.timeouts.join() !== locked.timeouts.join() ||
      locked.dirty === true;
    const version = changed ? await saveGame(tx, locked, rt, events) : locked.version;
    const response = await respondGame(tx, locked, rt, version, events);
    if (options.receipt)
      await storeReceipt(tx, matchId, userId, options.receipt.key, options.receipt.hash, {
        status: "accepted",
        ...response,
      });
    return response;
  });
}

/** "เล่นอีกรอบ": a new match in the same room with the same seats (QM6). Idempotent per match. */
export async function rematch(userId: string, matchId: string): Promise<{ matchId: string }> {
  await rateLimit(userId, "room.create", 20, 60);
  return db().begin(async (tx) => {
    const locked = await lockGame(tx, matchId, userId);
    if (locked.status === "active") throw new HttpError(409, "match_active", "Match still running");
    if (locked.mode === "online")
      throw new HttpError(
        409,
        "use_lobby",
        "Online rematch starts from the room after everyone is ready",
      );
    if (!locked.seats.some((x) => x.user_id === userId))
      throw new HttpError(403, "not_seated", "Only players can start a rematch");
    const [existing] = await tx<{ id: string }[]>`
      select id from public.matches where room_id = ${locked.roomId} and status = 'active' limit 1`;
    if (existing) return { matchId: existing.id };
    await tx`update private.round_stats set rematch = true where match_id = ${matchId}`;
    return { matchId: await startMatch(tx, locked.roomId) };
  });
}

/** A player leaves an online match: a bot takes the seat. Solo: the match ends. */
export async function leaveGame(userId: string, matchId: string): Promise<{ ok: true }> {
  return db().begin(async (tx) => {
    const locked = await lockGame(tx, matchId, userId);
    if (locked.mode !== "online") {
      await tx`update private.round_stats set left_early = left_early + 1 where match_id = ${matchId}`;
      await tx`update public.matches set status = 'abandoned', finished_at = now() where id = ${matchId} and status = 'active'`;
      await tx`update public.game_rooms set status = 'closed' where id = (select room_id from public.matches where id = ${matchId})`;
      return { ok: true };
    }
    const own = locked.seats.find((s) => s.user_id === userId);
    if (!own) throw new HttpError(404, "not_found", "Match not found");
    await tx`update private.round_stats set left_early = left_early + 1 where match_id = ${matchId}`;
    await tx`update public.match_players set player_type = 'bot', status = 'left', user_id = null where id = ${own.id}`;
    if (own.room_player_id)
      await tx`update public.room_players set status = 'left' where id = ${own.room_player_id}`;
    const humans = locked.seats.filter((s) => s.player_type === "human" && s.id !== own.id);
    if (humans.length === 0) {
      await tx`update public.matches set status = 'abandoned', finished_at = now() where id = ${matchId}`;
      await tx`update public.game_rooms set status = 'closed' where id = (select room_id from public.matches where id = ${matchId})`;
    }
    return { ok: true };
  });
}

/** Builds the engine state for a room and stores it (room → playing). */
async function startMatch(tx: Tx, roomId: string): Promise<string> {
  const seats = await tx<{ id: string; seat: number; player_type: Kind; user_id: string | null }[]>`
    select id, seat, player_type, user_id from public.room_players
    where room_id = ${roomId} and status <> 'left' order by seat`;
  if (
    seats.length < discard.DISCARD_RULES.minPlayers ||
    seats.length > discard.DISCARD_RULES.maxPlayers
  )
    throw new HttpError(409, "not_enough_players", "2–8 players needed");
  const [match] = await tx<{ id: string }[]>`
    insert into public.matches (room_id, status, phase, engine_version, ruleset_version, started_at)
    values (${roomId}, 'active', 'play', ${ENGINE_VERSION}, '13', now()) returning id`;
  if (!match) throw new Error("match insert failed");
  const playerIds = seats.map(() => crypto.randomUUID());
  const rng = createSeededRandom(cryptoSeed());
  const { state, events } = discard.startGame(playerIds, rng);
  for (const [i, s] of seats.entries()) {
    await tx`
      insert into public.match_players (id, match_id, room_player_id, user_id, seat, player_type, hand_count)
      values (${playerIds[i] ?? ""}, ${match.id}, ${s.id}, ${s.user_id}, ${i + 1}, ${s.player_type},
              ${state.players[i]?.hand.length ?? 0})`;
  }
  await tx`
    insert into private.match_runtime (match_id, rng_state, internal_state)
    values (${match.id}, ${encodeRng(rng.getState())}, ${tx.json(state as never)})`;
  const rows = events.map((e, i) => ({
    match_id: match.id,
    event_seq: i + 1,
    round_number: 1,
    event_type: e.type,
    public_payload: e,
  }));
  if (rows.length > 0) await tx`insert into public.match_events ${tx(rows as never)}`;
  const [room] = await tx<
    { mode: Mode }[]
  >`select mode from public.game_rooms where id = ${roomId}`;
  await tx`
    insert into private.round_stats (match_id, ruleset_version, mode, players, humans, opening)
    values (${match.id}, ${RULESET_VERSION}, ${room?.mode ?? "solo"}, ${seats.length},
            ${seats.filter((x) => x.player_type === "human").length},
            ${tx.json(state.players.map((p) => p.hand.map((c) => c.cardId)))})`;
  await tx`update public.game_rooms set status = 'playing' where id = ${roomId}`;
  return match.id;
}

async function displayName(tx: Tx, userId: string): Promise<string> {
  const [p] = await tx<
    { display_name: string }[]
  >`select display_name from public.profiles where id = ${userId}`;
  return p?.display_name ?? "Player";
}

/** Solo: you + 1–7 server bots; room + match in one step. */
export async function createGame(userId: string, bots: number): Promise<string> {
  await rateLimit(userId, "room.create", 20, 60);
  return db().begin(async (tx) => {
    const size = bots + 1;
    const [room] = await tx<{ id: string }[]>`
      insert into public.game_rooms (owner_id, mode, status, max_players)
      values (${userId}, 'solo', 'lobby', ${size}) returning id`;
    if (!room) throw new Error("room insert failed");
    await tx`insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot, status)
        values (${room.id}, ${userId}, 1, 'human', ${await displayName(tx, userId)}, 'ready')`;
    for (let i = 2; i <= size; i++)
      await tx`insert into public.room_players (room_id, seat, player_type, display_name_snapshot, status)
          values (${room.id}, ${i}, 'bot', ${`Bot ${String(i - 1)}`}, 'ready')`;
    return startMatch(tx, room.id);
  });
}

/** Online: the owner starts a lobby room once everyone is ready (2–8 players). */
export async function startOnlineGame(userId: string, roomId: string): Promise<string> {
  return db().begin(async (tx) => {
    const [room] = await tx<{ owner_id: string; status: string; mode: Mode }[]>`
      select owner_id, status, mode from public.game_rooms where id = ${roomId} for update`;
    if (room?.owner_id !== userId || room.mode !== "online")
      throw new HttpError(404, "not_found", "Room not found");
    if (room.status !== "lobby")
      throw new HttpError(409, "room_not_in_lobby", "Room already started");
    const lobby = await tx<{ status: string }[]>`
      select status from public.room_players where room_id = ${roomId} and status <> 'left'`;
    if (lobby.some((p) => p.status !== "ready"))
      throw new HttpError(409, "not_ready", "All players must be ready");
    return startMatch(tx, roomId);
  });
}
