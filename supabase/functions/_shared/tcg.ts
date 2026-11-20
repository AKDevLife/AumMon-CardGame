/**
 * Ruleset 2 (1v1 TCG) server adapter: create/start, lock → advance (bots, 90 s turn
 * timer) → command → advance → save, and per-seat views. `now` is passed in; the
 * engine stays pure. Clients send intent only (blueprint §1.3, spec §1.3).
 */
import { createSeededRandom, ENGINE_VERSION, v2, type RngState } from "@aummon/game-engine";
import { db } from "./db.ts";
import { HttpError } from "./http.ts";
import { rateLimit } from "./ratelimit.ts";
import { findReceipt, storeReceipt } from "./receipts.ts";
import { decodeRng, encodeRng, type Tx } from "./store.ts";
import { actingSeat, advanceTcg, type Kind, type Mode, type TcgRuntime } from "./tcg-flow.ts";

type Seat = v2.Seat;

interface SeatRow {
  id: string;
  seat: number;
  player_type: Kind;
  user_id: string | null;
  display_name: string;
}

interface Locked extends TcgRuntime {
  matchId: string;
  userId: string;
  ownerId: string;
  mode: Mode;
  version: number;
  seats: SeatRow[];
}

const seatIndex = (seat: number): Seat => (seat === 1 ? 0 : 1);

function cryptoSeed(): RngState {
  const s = crypto.getRandomValues(new Uint32Array(4));
  if (s.every((v) => v === 0)) s[0] = 1;
  return [s[0] ?? 1, s[1] ?? 0, s[2] ?? 0, s[3] ?? 0];
}

// ---------------------------------------------------------------- persistence

async function lockTcg(tx: Tx, matchId: string, userId: string): Promise<Locked> {
  const lock =
    await tx`select id from public.matches where id = ${matchId} and ruleset_version = '2' for update`;
  if (lock.length === 0) throw new HttpError(404, "not_found", "Match not found");
  const [row] = await tx<
    {
      owner_id: string;
      mode: Mode;
      version: string;
      internal_state: v2.MatchState;
      rng_state: Uint8Array;
      phase_deadline: Date | null;
    }[]
  >`
    select r.owner_id, r.mode, m.version, rt.internal_state, rt.rng_state, rt.phase_deadline
    from public.matches m
    join public.game_rooms r on r.id = m.room_id
    join private.match_runtime rt on rt.match_id = m.id
    where m.id = ${matchId}`;
  if (!row) throw new HttpError(404, "not_found", "Match not found");
  const seats = await tx<SeatRow[]>`
    select mp.id, mp.seat, mp.player_type, mp.user_id, coalesce(rp.display_name_snapshot, 'Player') as display_name
    from public.match_players mp left join public.room_players rp on rp.id = mp.room_player_id
    where mp.match_id = ${matchId} order by mp.seat`;
  if (!seats.some((s) => s.user_id === userId) && row.owner_id !== userId)
    throw new HttpError(404, "not_found", "Match not found");
  return {
    matchId,
    userId,
    ownerId: row.owner_id,
    mode: row.mode,
    version: Number(row.version),
    seats,
    state: row.internal_state,
    rng: decodeRng(row.rng_state),
    deadline: row.phase_deadline ? row.phase_deadline.getTime() : null,
  };
}

async function saveTcg(
  tx: Tx,
  locked: Locked,
  rt: TcgRuntime,
  events: v2.GameEvent[],
): Promise<number> {
  const { state } = rt;
  const finished = state.status === "finished";
  const version = locked.version + 1;
  const phase = state.status === "mulligan" ? "mulligan" : state.phase;
  await tx`
    update public.matches set
      phase = ${phase}, round_number = ${state.turn}, version = ${version},
      status = ${finished ? "finished" : "active"}, finished_at = ${finished ? tx`now()` : null}
    where id = ${locked.matchId}`;
  for (const s of locked.seats) {
    const p = state.players[seatIndex(s.seat)];
    const lost =
      state.result !== null &&
      "winner" in state.result &&
      state.result.winner !== seatIndex(s.seat);
    await tx`update public.match_players set hp = ${Math.max(0, p.hp)}, status = ${lost ? "eliminated" : "alive"}
      where id = ${s.id} and match_id = ${locked.matchId}`;
  }
  await tx`
    update private.match_runtime set internal_state = ${tx.json(state as never)},
      rng_state = ${encodeRng(rt.rng)}, phase_deadline = ${rt.deadline === null ? null : new Date(rt.deadline)}
    where match_id = ${locked.matchId}`;
  if (events.length > 0) {
    const [seq] = await tx<{ next: string }[]>`
      select coalesce(max(event_seq), 0) + 1 as next from public.match_events where match_id = ${locked.matchId}`;
    const rows = events.map((e, i) => ({
      match_id: locked.matchId,
      event_seq: Number(seq?.next ?? 1) + i,
      round_number: state.turn,
      event_type: e.type,
      public_payload: e,
    }));
    await tx`insert into public.match_events ${tx(rows as never)}`;
  }
  if (finished) {
    const [room] = await tx<
      { room_id: string }[]
    >`select room_id from public.matches where id = ${locked.matchId}`;
    if (room) await tx`update public.game_rooms set status = 'closed' where id = ${room.room_id}`;
  }
  return version;
}

// ---------------------------------------------------------------- views

/** Seat the caller controls now (own seat; Pass & Play owner → acting local seat). */
function actorSeat(locked: Locked, state: v2.MatchState): Seat | null {
  if (locked.mode === "pass_play")
    return locked.ownerId === locked.userId ? actingSeat(state) : null;
  const own = locked.seats.find((s) => s.user_id === locked.userId);
  return own ? seatIndex(own.seat) : null;
}

export interface TcgResponse {
  matchId: string;
  rulesetVersion: "2";
  mode: Mode;
  version: number;
  deadline: string | null;
  /** Seat whose private view is shown; null = no hand visible (Pass & Play before reveal). */
  seat: Seat | null;
  actingSeat: Seat | null;
  names: [string, string];
  view: v2.PlayerView;
  legal: v2.LegalCommand[];
  events: unknown[];
}

async function respondTcg(
  tx: Tx,
  locked: Locked,
  rt: TcgRuntime,
  version: number,
  reveal: boolean,
): Promise<TcgResponse> {
  const { state } = rt;
  const acting = actingSeat(state);
  const own = actorSeat(locked, state);
  const seat = locked.mode === "pass_play" ? (reveal ? own : null) : own;
  const view = v2.getPlayerView(state, seat ?? 0);
  const safeView = seat === null ? { ...view, myHand: [] } : view;
  const events = await tx<{ public_payload: unknown }[]>`
    select public_payload from public.match_events where match_id = ${locked.matchId}
    order by event_seq desc limit 40`;
  const name = (i: number) => locked.seats.find((s) => s.seat === i)?.display_name ?? "Player";
  return {
    matchId: locked.matchId,
    rulesetVersion: "2",
    mode: locked.mode,
    version,
    deadline: rt.deadline === null ? null : new Date(rt.deadline).toISOString(),
    seat,
    actingSeat: acting,
    names: [name(1), name(2)],
    view: safeView,
    legal: seat !== null && seat === acting ? v2.getLegalCommands(state, seat) : [],
    events: events.map((e) => e.public_payload).reverse(),
  };
}

// ---------------------------------------------------------------- use cases

const kindsOf = (locked: Locked): [Kind, Kind] => [
  locked.seats.find((s) => s.seat === 1)?.player_type ?? "human",
  locked.seats.find((s) => s.seat === 2)?.player_type ?? "human",
];

/** Load, apply due bots/timeouts, optionally run `act`, save, respond. */
export async function withTcg(
  userId: string,
  matchId: string,
  options: {
    reveal?: boolean;
    act?: (
      state: v2.MatchState,
      seat: Seat,
      rng: ReturnType<typeof createSeededRandom>,
    ) => v2.Transition;
    expectedVersion?: number;
    /** Idempotency (blueprint §4.6): same key + payload → stored response. */
    receipt?: { key: string; hash: string };
  } = {},
): Promise<unknown> {
  await rateLimit(userId, "match.read", 240, 60);
  return db().begin(async (tx) => {
    const locked = await lockTcg(tx, matchId, userId);
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
    let rt = advanceTcg(locked, kinds, locked.mode, now);
    const events = [...rt.events];
    if (options.act) {
      if (options.expectedVersion !== undefined && options.expectedVersion !== locked.version)
        throw new HttpError(409, "stale_version", "State changed; refresh and retry");
      const seat = actorSeat(locked, rt.state);
      if (seat === null) throw new HttpError(403, "not_your_turn", "You cannot act now");
      const rng = createSeededRandom(rt.rng);
      let t: v2.Transition;
      try {
        t = options.act(rt.state, seat, rng);
      } catch (e) {
        if (e instanceof v2.CommandError) throw new HttpError(409, e.code, e.code);
        throw e;
      }
      events.push(...t.events);
      const after = advanceTcg(
        { state: t.state, rng: rng.getState(), deadline: rt.deadline },
        kinds,
        locked.mode,
        now,
      );
      events.push(...after.events);
      rt = after;
    }
    const changed = events.length > 0 || rt.deadline !== locked.deadline;
    const version = changed ? await saveTcg(tx, locked, rt, events) : locked.version;
    const response = await respondTcg(tx, locked, rt, version, options.reveal ?? false);
    if (options.receipt)
      await storeReceipt(tx, matchId, userId, options.receipt.key, options.receipt.hash, {
        status: "accepted",
        ...response,
      });
    return response;
  });
}

/** Builds the engine state for a ruleset 2 room and stores it (room → playing). */
async function startTcgMatch(tx: Tx, roomId: string): Promise<string> {
  const seats = await tx<{ id: string; seat: number; player_type: Kind; user_id: string | null }[]>`
    select id, seat, player_type, user_id from public.room_players
    where room_id = ${roomId} and status <> 'left' order by seat`;
  if (seats.length !== 2)
    throw new HttpError(409, "not_enough_players", "1v1 needs exactly 2 players");
  const [deck] = await tx<{ id: string; version: number }[]>`
    select id, version from public.deck_templates where id = 'starter_v2' and is_active and ruleset_version = '2'`;
  if (!deck) throw new Error("No active starter_v2 deck");
  const cards = await tx<{ card_definition_id: string; quantity: number }[]>`
    select card_definition_id, quantity from public.deck_template_cards
    where deck_template_id = ${deck.id} and deck_template_version = ${deck.version}`;
  const list = Object.fromEntries(cards.map((c) => [c.card_definition_id, c.quantity]));

  const [match] = await tx<{ id: string }[]>`
    insert into public.matches (room_id, deck_template_id, deck_template_version, status, phase, engine_version, ruleset_version, started_at)
    values (${roomId}, ${deck.id}, ${deck.version}, 'active', 'mulligan', ${ENGINE_VERSION}, '2', now()) returning id`;
  if (!match) throw new Error("match insert failed");
  const playerIds = seats.map(() => crypto.randomUUID()) as [string, string];
  const rng = createSeededRandom(cryptoSeed());
  const state = v2.initializeMatch({ playerIds, decks: [list, list] }, rng);
  for (const [i, s] of seats.entries()) {
    await tx`
      insert into public.match_players (id, match_id, room_player_id, user_id, seat, player_type, hp, max_hp)
      values (${playerIds[i] ?? ""}, ${match.id}, ${s.id}, ${s.user_id}, ${s.seat}, ${s.player_type},
              ${v2.RULESET_V2.playerHp}, ${v2.RULESET_V2.playerHp})`;
  }
  await tx`
    insert into private.match_runtime (match_id, rng_state, internal_state)
    values (${match.id}, ${encodeRng(rng.getState())}, ${tx.json(state as never)})`;
  await tx`update public.game_rooms set status = 'playing' where id = ${roomId}`;
  return match.id;
}

async function displayName(tx: Tx, userId: string): Promise<string> {
  const [p] = await tx<
    { display_name: string }[]
  >`select display_name from public.profiles where id = ${userId}`;
  return p?.display_name ?? "Player";
}

/** Solo (human vs server bot) or Pass & Play (2 local seats): room + match in one step. */
export async function createTcgMatch(
  userId: string,
  mode: "solo" | "pass_play",
  localNames: readonly [string, string] | null,
): Promise<string> {
  await rateLimit(userId, "room.create", 20, 60);
  return db().begin(async (tx) => {
    const [room] = await tx<{ id: string }[]>`
      insert into public.game_rooms (owner_id, mode, status, max_players, ruleset_version)
      values (${userId}, ${mode}, 'lobby', 2, '2') returning id`;
    if (!room) throw new Error("room insert failed");
    if (mode === "solo") {
      await tx`insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot, status)
        values (${room.id}, ${userId}, 1, 'human', ${await displayName(tx, userId)}, 'ready')`;
      await tx`insert into public.room_players (room_id, seat, player_type, display_name_snapshot, status)
        values (${room.id}, 2, 'bot', 'Bot', 'ready')`;
    } else {
      if (!localNames) throw new HttpError(400, "invalid_seats", "Pass & Play needs 2 names");
      for (const [i, name] of localNames.entries()) {
        await tx`insert into public.room_players (room_id, seat, player_type, display_name_snapshot, status)
          values (${room.id}, ${i + 1}, 'local', ${name}, 'ready')`;
      }
    }
    return startTcgMatch(tx, room.id);
  });
}

/** Online: owner starts a ruleset 2 lobby room once both players are ready. */
export async function startOnlineTcg(userId: string, roomId: string): Promise<string> {
  return db().begin(async (tx) => {
    const [room] = await tx<
      { owner_id: string; status: string; ruleset_version: string; mode: Mode }[]
    >`
      select owner_id, status, ruleset_version, mode from public.game_rooms where id = ${roomId} for update`;
    if (room?.owner_id !== userId || room.ruleset_version !== "2" || room.mode !== "online")
      throw new HttpError(404, "not_found", "Room not found");
    if (room.status !== "lobby")
      throw new HttpError(409, "room_not_in_lobby", "Room already started");
    const lobby = await tx<{ status: string }[]>`
      select status from public.room_players where room_id = ${roomId} and status <> 'left'`;
    if (lobby.some((p) => p.status !== "ready"))
      throw new HttpError(409, "not_ready", "All players must be ready");
    return startTcgMatch(tx, roomId);
  });
}
