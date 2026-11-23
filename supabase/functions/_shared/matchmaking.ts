/**
 * Quick Match (GC4.4): automatic matchmaking for any enabled game. Players queue for
 * (game, table size); the first full group gets a room + match. After BOT_FILL_MS of waiting the
 * oldest waiting player's table is filled with server bots so nobody waits forever.
 * Serialised per (game, size) with a transaction-scoped advisory lock.
 */
import { db } from "./db.ts";
import { enabledGame, startMatch } from "./game.ts";
import { HttpError } from "./http.ts";
import { rateLimit } from "./ratelimit.ts";
import type { Tx } from "./store.ts";

export const BOT_FILL_MS = 30_000;

export interface QueueStatus {
  status: "idle" | "waiting" | "matched";
  gameId?: string;
  players?: number;
  waiting?: number;
  matchId?: string;
  waitedMs?: number;
}

async function lockKey(tx: Tx, gameId: string, players: number) {
  await tx`select pg_advisory_xact_lock(hashtext(${`mm:${gameId}:${String(players)}`}))`;
}

/** Forms tables from the queue for (game, size); returns nothing (rows get status 'matched'). */
async function formTables(tx: Tx, gameId: string, players: number, now: number): Promise<void> {
  for (;;) {
    const waiting = await tx<{ user_id: string; enqueued_at: Date }[]>`
      select user_id, enqueued_at from private.matchmaking_queue
      where game_id = ${gameId} and players = ${players} and status = 'waiting'
      order by enqueued_at, user_id`;
    const oldest = waiting[0];
    if (!oldest) return;
    const full = waiting.length >= players;
    const timedOut = now - oldest.enqueued_at.getTime() >= BOT_FILL_MS;
    if (!full && !timedOut) return;
    const group = waiting.slice(0, players);
    const ids = group.map((g) => g.user_id);
    const [room] = await tx<{ id: string }[]>`
      insert into public.game_rooms (owner_id, game_id, mode, status, max_players, ruleset_version)
      values (${ids[0] ?? null}, ${gameId}, 'quick_match', 'lobby', ${players},
              (select current_ruleset from public.games where id = ${gameId}))
      returning id`;
    if (!room) throw new Error("room insert failed");
    const names = await tx<{ id: string; display_name: string }[]>`
      select id, display_name from public.profiles where id in ${tx(ids)}`;
    for (const [i, id] of ids.entries())
      await tx`insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot, status)
        values (${room.id}, ${id}, ${i + 1}, 'human', ${names.find((n) => n.id === id)?.display_name ?? "Player"}, 'ready')`;
    for (let seat = ids.length + 1; seat <= players; seat++)
      await tx`insert into public.room_players (room_id, seat, player_type, display_name_snapshot, status)
        values (${room.id}, ${seat}, 'bot', ${`Bot ${String(seat - ids.length)}`}, 'ready')`;
    const matchId = await startMatch(tx, room.id);
    await tx`update private.matchmaking_queue set status = 'matched', match_id = ${matchId}
      where user_id in ${tx(ids)}`;
    if (!full) return;
  }
}

async function statusOf(tx: Tx, userId: string, now: number): Promise<QueueStatus> {
  const [row] = await tx<
    {
      game_id: string;
      players: number;
      status: "waiting" | "matched";
      match_id: string | null;
      enqueued_at: Date;
    }[]
  >`select game_id, players, status, match_id, enqueued_at from private.matchmaking_queue where user_id = ${userId}`;
  if (!row) return { status: "idle" };
  if (row.status === "matched" && row.match_id)
    return { status: "matched", gameId: row.game_id, players: row.players, matchId: row.match_id };
  const [count] = await tx<{ n: number }[]>`
    select count(*)::int as n from private.matchmaking_queue
    where game_id = ${row.game_id} and players = ${row.players} and status = 'waiting'`;
  return {
    status: "waiting",
    gameId: row.game_id,
    players: row.players,
    waiting: count?.n ?? 1,
    waitedMs: now - row.enqueued_at.getTime(),
  };
}

export async function joinQueue(
  userId: string,
  gameId: string,
  players: number,
): Promise<QueueStatus> {
  await rateLimit(userId, "mm.join", 20, 60);
  return db().begin(async (tx) => {
    const game = await enabledGame(tx, gameId);
    if (players < game.minPlayers || players > game.maxPlayers)
      throw new HttpError(400, "invalid_input", "players out of range for this game");
    await lockKey(tx, gameId, players);
    await tx`
      insert into private.matchmaking_queue (user_id, game_id, players)
      values (${userId}, ${gameId}, ${players})
      on conflict (user_id) do update set game_id = excluded.game_id, players = excluded.players,
        status = 'waiting', match_id = null, enqueued_at = now()`;
    const now = Date.now();
    await formTables(tx, gameId, players, now);
    return statusOf(tx, userId, now);
  });
}

/** Polled by the client while waiting; also fills timed-out tables with bots. */
export async function queueStatus(userId: string): Promise<QueueStatus> {
  await rateLimit(userId, "mm.status", 120, 60);
  return db().begin(async (tx) => {
    const now = Date.now();
    const [row] = await tx<{ game_id: string; players: number; status: string }[]>`
      select game_id, players, status from private.matchmaking_queue where user_id = ${userId}`;
    if (row?.status === "waiting") {
      await lockKey(tx, row.game_id, row.players);
      await formTables(tx, row.game_id, row.players, now);
    }
    return statusOf(tx, userId, now);
  });
}

export async function leaveQueue(userId: string): Promise<{ ok: true }> {
  await db()`delete from private.matchmaking_queue where user_id = ${userId}`;
  return { ok: true };
}
