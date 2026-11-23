/**
 * Platform match orchestrator (Game Center, docs/architecture/MASTER_ARCHITECTURE.md §5–6):
 * create/start, lock → advance (bots, timers) → command → advance → save, and per-seat views.
 * The game module is always chosen from matches.game_id (never from client input).
 * Clients send intent only; hidden information stays in private.match_runtime.
 */
import {
  createSeededRandom,
  ENGINE_VERSION,
  getGameModule,
  sdk,
  type RngState,
} from "@aummon/game-engine";
import { db } from "./db.ts";
import { edoHooks } from "./games/edo-battle.ts";
import { HttpError } from "./http.ts";
import { rateLimit } from "./ratelimit.ts";
import { findReceipt, storeReceipt } from "./receipts.ts";
import { decodeRng, encodeRng, type Tx } from "./store.ts";

type Kind = sdk.Kind;
export type Mode = sdk.Mode;
type Game = sdk.AnyGameModule;
interface GameEvent {
  readonly type: string;
}
type Runtime = sdk.Runtime<unknown>;

interface SeatRow {
  id: string;
  seat: number;
  player_type: Kind;
  user_id: string | null;
  room_player_id: string | null;
  display_name: string;
}

export interface Locked extends Runtime {
  matchId: string;
  roomId: string;
  gameId: string;
  game: Game;
  rulesetVersion: string;
  status: string;
  userId: string;
  ownerId: string;
  mode: Mode;
  version: number;
  seats: SeatRow[];
  /** Runtime changed outside the engine (e.g. resume) — save even without events. */
  dirty?: boolean;
}

/** Game-specific server hooks (telemetry); optional per game. */
export interface GameHooks {
  onStart?(
    tx: Tx,
    matchId: string,
    state: unknown,
    mode: Mode,
    seats: { player_type: Kind }[],
  ): Promise<void>;
  onSave?(tx: Tx, locked: Locked, state: unknown, events: readonly GameEvent[]): Promise<void>;
  onHumanAction?(
    tx: Tx,
    locked: Locked,
    before: Runtime,
    seat: number,
    events: readonly GameEvent[],
    now: number,
  ): Promise<void>;
}

const HOOKS: Record<string, GameHooks | undefined> = { edo_battle: edoHooks };
const hooksOf = (gameId: string): GameHooks => HOOKS[gameId] ?? {};

/** DB seats are 1-based; engine seats are 0-based. */
const toEngine = (seat: number) => seat - 1;

function cryptoSeed(): RngState {
  const s = crypto.getRandomValues(new Uint32Array(4));
  if (s.every((v) => v === 0)) s[0] = 1;
  return [s[0] ?? 1, s[1] ?? 0, s[2] ?? 0, s[3] ?? 0];
}

/** Loads an enabled game's module (404 for unknown / disabled games). */
export async function enabledGame(tx: Tx, gameId: string): Promise<Game> {
  const [row] = await tx<{ id: string }[]>`
    select id from public.games where id = ${gameId} and is_enabled`;
  if (!row) throw new HttpError(404, "game_not_found", "Game not available");
  try {
    return getGameModule(gameId);
  } catch {
    throw new HttpError(404, "game_not_found", "Game not available");
  }
}

// ---------------------------------------------------------------- persistence

async function lockGame(tx: Tx, matchId: string, userId: string): Promise<Locked> {
  const lock = await tx`select id from public.matches where id = ${matchId} for update`;
  if (lock.length === 0) throw new HttpError(404, "not_found", "Match not found");
  const [row] = await tx<
    {
      owner_id: string;
      room_id: string;
      game_id: string;
      ruleset_version: string;
      status: string;
      seat_timeouts: number[];
      mode: Mode;
      version: string;
      internal_state: unknown;
      rng_state: Uint8Array;
      phase_deadline: Date | null;
    }[]
  >`
    select r.owner_id, m.room_id, m.game_id, m.ruleset_version, m.status, rt.seat_timeouts, r.mode,
           m.version, rt.internal_state, rt.rng_state, rt.phase_deadline
    from public.matches m
    join public.game_rooms r on r.id = m.room_id
    join private.match_runtime rt on rt.match_id = m.id
    where m.id = ${matchId}`;
  if (!row) throw new HttpError(404, "not_found", "Match not found");
  let game: Game;
  try {
    game = getGameModule(row.game_id);
  } catch {
    throw new HttpError(404, "not_found", "Match not found");
  }
  // Only the game's current ruleset is playable (retired rulesets stay as history).
  if (row.ruleset_version !== game.rulesetVersion)
    throw new HttpError(404, "not_found", "Match not found");
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
    gameId: row.game_id,
    game,
    rulesetVersion: row.ruleset_version,
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

function eventRows(
  game: Game,
  matchId: string,
  firstSeq: number,
  round: number,
  events: readonly GameEvent[],
) {
  return events
    .flatMap((e) => {
      const payload = game.publicEvent(e);
      return payload === null
        ? []
        : [{ match_id: matchId, event_type: e.type, round_number: round, payload }];
    })
    .map((r, i) => ({
      match_id: r.match_id,
      event_seq: firstSeq + i,
      round_number: r.round_number,
      event_type: r.event_type,
      public_payload: r.payload,
    }));
}

async function saveGame(tx: Tx, locked: Locked, rt: Runtime, events: GameEvent[]): Promise<number> {
  const { game } = locked;
  const { state } = rt;
  const finished = game.isFinished(state);
  const winners = game.result(state)?.winners ?? [];
  const counts = game.handCounts(state);
  const version = locked.version + 1;
  await tx`
    update public.matches set
      phase = ${game.phase(state)}, round_number = ${game.round(state)}, version = ${version},
      status = ${finished ? "finished" : "active"}, finished_at = ${finished ? tx`now()` : null}
    where id = ${locked.matchId}`;
  for (const s of locked.seats) {
    const seat = toEngine(s.seat);
    const status = winners.includes(seat) ? "won" : "playing";
    await tx`update public.match_players
      set hand_count = ${counts[seat] ?? 0}, status = ${status}, player_type = ${s.player_type}
      where id = ${s.id} and match_id = ${locked.matchId}`;
  }
  await tx`
    update private.match_runtime set internal_state = ${tx.json(state as never)},
      rng_state = ${encodeRng(rt.rng)}, seat_timeouts = ${rt.timeouts}, phase_deadline = ${rt.deadline === null ? null : new Date(rt.deadline)}
    where match_id = ${locked.matchId}`;
  if (events.length > 0) {
    const [seq] = await tx<{ next: string }[]>`
      select coalesce(max(event_seq), 0) + 1 as next from public.match_events where match_id = ${locked.matchId}`;
    const rows = eventRows(game, locked.matchId, Number(seq?.next ?? 1), game.round(state), events);
    if (rows.length > 0) await tx`insert into public.match_events ${tx(rows as never)}`;
  }
  await hooksOf(locked.gameId).onSave?.(tx, locked, state, events);
  if (finished) {
    if (locked.mode !== "solo") {
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

// ---------------------------------------------------------------- views

/** Seat the caller controls (own seat). */
function actorSeat(locked: Locked): number | null {
  const own = locked.seats.find((s) => s.user_id === locked.userId);
  return own ? toEngine(own.seat) : null;
}

export interface GameResponse {
  matchId: string;
  gameId: string;
  rulesetVersion: string;
  mode: Mode;
  version: number;
  deadline: string | null;
  /** Caller's seat; null = spectator / not seated. */
  seat: number | null;
  acting: number | null;
  botActing: boolean;
  names: string[];
  view: unknown;
  events: unknown[];
  /** Private payloads only the caller may see from this request (e.g. EDO Magnifier peeks). */
  peeks: unknown[];
  /** Server clock (ms) so the client can correct its countdown; the client never decides time. */
  serverNow: number;
  /** Seats the server is playing because of repeated timeouts (Online). */
  autoSeats: number[];
  /** Finished match: the rematch in the same room, once someone started it. */
  nextMatchId: string | null;
  /** Room of this match (Online: the lobby to go back to for the next round). */
  roomId: string;
}

const kindsOf = (locked: Locked): Kind[] =>
  [...locked.seats].sort((a, b) => a.seat - b.seat).map((s) => s.player_type);

const effective = (locked: Locked, timeouts: readonly number[]) =>
  sdk.effectiveKinds(kindsOf(locked), timeouts, locked.mode, locked.game.afkTimeouts);

async function respondGame(
  tx: Tx,
  locked: Locked,
  rt: Runtime,
  version: number,
  fresh: readonly GameEvent[],
): Promise<GameResponse> {
  const { game } = locked;
  const { state } = rt;
  const acting = game.actingSeat(state);
  const seat = actorSeat(locked);
  const events = await tx<{ public_payload: unknown }[]>`
    select public_payload from public.match_events where match_id = ${locked.matchId}
    order by event_seq desc limit 60`;
  const kinds = effective(locked, rt.timeouts);
  const [next] = game.isFinished(state)
    ? await tx<{ id: string }[]>`
          select id from public.matches where room_id = ${locked.roomId} and id <> ${locked.matchId}
            and created_at > (select created_at from public.matches where id = ${locked.matchId})
          order by created_at desc limit 1`
    : [];
  return {
    matchId: locked.matchId,
    gameId: locked.gameId,
    rulesetVersion: locked.rulesetVersion,
    mode: locked.mode,
    version,
    deadline: rt.deadline === null ? null : new Date(rt.deadline).toISOString(),
    seat,
    acting,
    botActing: acting !== null && kinds[acting] === "bot",
    names: [...locked.seats].sort((a, b) => a.seat - b.seat).map((s) => s.display_name),
    view: game.view(state, seat),
    events: events.map((e) => e.public_payload).reverse(),
    peeks: game.privateEvents(fresh, seat),
    serverNow: Date.now(),
    autoSeats: kinds.flatMap((k, i) => (k === "bot" && kindsOf(locked)[i] === "human" ? [i] : [])),
    nextMatchId: next?.id ?? null,
    roomId: locked.roomId,
  };
}

// ---------------------------------------------------------------- use cases

/** Load, apply due bots/timeouts, optionally run the caller's command, save, respond. */
export async function withGame(
  userId: string,
  matchId: string,
  options: {
    /** Raw client intent; parsed by the match's game module. */
    command?: unknown;
    expectedVersion?: number;
    receipt?: { key: string; hash: string };
    /** Online auto-play: the player is back — clear their timeout streak. */
    resume?: boolean;
  } = {},
): Promise<unknown> {
  await rateLimit(userId, "match.read", 240, 60);
  return db().begin(async (tx) => {
    const locked = await lockGame(tx, matchId, userId);
    const { game } = locked;
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
    let command: unknown;
    if (options.command !== undefined) {
      try {
        command = game.parseCommand(options.command);
      } catch (e) {
        if (e instanceof sdk.InvalidCommandError)
          throw new HttpError(400, "invalid_input", e.message);
        throw e;
      }
    }
    const now = Date.now();
    const kinds = kindsOf(locked);
    const own = actorSeat(locked);
    if (options.resume && own !== null && (locked.timeouts[own] ?? 0) > 0) {
      locked.timeouts = game
        .handCounts(locked.state)
        .map((_, i) => (i === own ? 0 : (locked.timeouts[i] ?? 0)));
      locked.dirty = true;
    }
    const acts = options.command !== undefined;
    // A command that reached the server within the grace window still beats the timeout.
    let rt: Runtime & { events: GameEvent[] } = sdk.advance(
      game,
      locked,
      kinds,
      acts ? now - sdk.GRACE_MS : now,
      locked.mode,
    );
    const events: GameEvent[] = [...rt.events];
    if (acts) {
      const stale =
        options.expectedVersion !== undefined && options.expectedVersion !== locked.version;
      if (stale && game.allowsStaleVersion?.(command) !== true)
        throw new HttpError(409, "stale_version", "State changed; refresh and retry");
      const seat = actorSeat(locked);
      if (seat === null) throw new HttpError(403, "not_your_turn", "You cannot act now");
      const rng = createSeededRandom(rt.rng);
      let t: sdk.Transition<unknown, GameEvent>;
      try {
        t = game.apply(rt.state, seat, command, rng);
      } catch (e) {
        if (e instanceof sdk.GameRuleError) throw new HttpError(409, e.code, e.code);
        throw e;
      }
      events.push(...t.events);
      await hooksOf(locked.gameId).onHumanAction?.(tx, locked, rt, seat, t.events, now);
      // Acting resets this seat's timeout streak (and ends auto-play).
      const timeouts = rt.timeouts.map((x, i) => (i === seat ? 0 : x));
      const after = sdk.advance(
        game,
        {
          state: t.state,
          rng: rng.getState(),
          // Each turn gets its own full timer (owner report: the timer carried over to the next player).
          deadline: sdk.deadlineAfterAct(game, rt.state, t.state, rt.deadline),
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
    if (locked.mode !== "solo")
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
    if (locked.mode === "solo") {
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

/** Builds the game state for a room and stores it (room → playing). */
export async function startMatch(tx: Tx, roomId: string): Promise<string> {
  const [room] = await tx<{ mode: Mode; game_id: string }[]>`
    select mode, game_id from public.game_rooms where id = ${roomId}`;
  if (!room) throw new HttpError(404, "not_found", "Room not found");
  const game = await enabledGame(tx, room.game_id);
  const seats = await tx<{ id: string; seat: number; player_type: Kind; user_id: string | null }[]>`
    select id, seat, player_type, user_id from public.room_players
    where room_id = ${roomId} and status <> 'left' order by seat`;
  if (seats.length < game.minPlayers || seats.length > game.maxPlayers)
    throw new HttpError(
      409,
      "not_enough_players",
      `${String(game.minPlayers)}–${String(game.maxPlayers)} players needed`,
    );
  const playerIds = seats.map(() => crypto.randomUUID());
  const rng = createSeededRandom(cryptoSeed());
  const { state, events } = game.start(playerIds, rng);
  const [match] = await tx<{ id: string }[]>`
    insert into public.matches (room_id, game_id, status, phase, engine_version, ruleset_version, started_at)
    values (${roomId}, ${game.id}, 'active', ${game.phase(state)}, ${ENGINE_VERSION}, ${game.rulesetVersion}, now()) returning id`;
  if (!match) throw new Error("match insert failed");
  const counts = game.handCounts(state);
  for (const [i, s] of seats.entries()) {
    await tx`
      insert into public.match_players (id, match_id, room_player_id, user_id, seat, player_type, hand_count)
      values (${playerIds[i] ?? ""}, ${match.id}, ${s.id}, ${s.user_id}, ${i + 1}, ${s.player_type},
              ${counts[i] ?? 0})`;
  }
  await tx`
    insert into private.match_runtime (match_id, rng_state, internal_state)
    values (${match.id}, ${encodeRng(rng.getState())}, ${tx.json(state as never)})`;
  const rows = eventRows(game, match.id, 1, game.round(state), events);
  if (rows.length > 0) await tx`insert into public.match_events ${tx(rows as never)}`;
  await hooksOf(game.id).onStart?.(tx, match.id, state, room.mode, seats);
  await tx`update public.game_rooms set status = 'playing' where id = ${roomId}`;
  return match.id;
}

async function displayName(tx: Tx, userId: string): Promise<string> {
  const [p] = await tx<
    { display_name: string }[]
  >`select display_name from public.profiles where id = ${userId}`;
  return p?.display_name ?? "Player";
}

/** Solo: you + server bots (game's seat limits); room + match in one step. */
export async function createGame(
  userId: string,
  bots: number,
  gameId = "edo_battle",
): Promise<string> {
  await rateLimit(userId, "room.create", 20, 60);
  return db().begin(async (tx) => {
    const game = await enabledGame(tx, gameId);
    const size = bots + 1;
    if (size < game.minPlayers || size > game.maxPlayers)
      throw new HttpError(400, "invalid_input", "bots out of range");
    const [room] = await tx<{ id: string }[]>`
      insert into public.game_rooms (owner_id, game_id, mode, status, max_players, ruleset_version)
      values (${userId}, ${game.id}, 'solo', 'lobby', ${size}, ${game.rulesetVersion}) returning id`;
    if (!room) throw new Error("room insert failed");
    await tx`insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot, status)
        values (${room.id}, ${userId}, 1, 'human', ${await displayName(tx, userId)}, 'ready')`;
    for (let i = 2; i <= size; i++)
      await tx`insert into public.room_players (room_id, seat, player_type, display_name_snapshot, status)
          values (${room.id}, ${i}, 'bot', ${`Bot ${String(i - 1)}`}, 'ready')`;
    return startMatch(tx, room.id);
  });
}

/** Online: the owner starts a lobby room once everyone is ready. */
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
