/**
 * Engine ↔ PostgreSQL adapter (blueprint §1.4). Every command runs inside one
 * transaction that locks the match row, so commands and resolution for a match
 * are serialized (single resolver; no duplicate resolve).
 */
import type { GameEvent, GameState, PlayerGameView, RngState } from "@aummon/game-engine";
import type { TransactionSql } from "npm:postgres@3.4.9";
import { HttpError } from "./http.ts";
import type { Runtime } from "./flow.ts";

export type Tx = TransactionSql;

export interface LockedMatch extends Runtime {
  matchId: string;
  userId: string;
  ownerId: string;
  /** Engine player id of the caller's seat (online/solo); null for owner-only access. */
  viewerPlayerId: string | null;
}

export function encodeRng(state: RngState): Uint8Array {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  state.forEach((v, i) => {
    view.setUint32(i * 4, v);
  });
  return bytes;
}

export function decodeRng(bytes: Uint8Array): RngState {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12)];
}

/** Lock the match row and load the canonical state. Rejects non-members with 404. */
export async function lockMatch(tx: Tx, matchId: string, userId: string): Promise<LockedMatch> {
  // Lock first, then read in a separate statement: under READ COMMITTED a joined
  // FOR UPDATE would re-check only the locked row and return a stale runtime row.
  const locked = await tx`select id from public.matches where id = ${matchId} for update`;
  if (locked.length === 0) throw new HttpError(404, "not_found", "Match not found");
  const rows = await tx<
    {
      owner_id: string;
      internal_state: GameState;
      rng_state: Uint8Array;
      phase_deadline: Date | null;
    }[]
  >`
    select r.owner_id, rt.internal_state, rt.rng_state, rt.phase_deadline
    from public.matches m
    join public.game_rooms r on r.id = m.room_id
    join private.match_runtime rt on rt.match_id = m.id
    where m.id = ${matchId}`;
  const row = rows[0];
  if (!row) throw new HttpError(404, "not_found", "Match not found");
  const seat = await tx<{ id: string }[]>`
    select id from public.match_players where match_id = ${matchId} and user_id = ${userId}`;
  const viewerPlayerId = seat[0]?.id ?? null;
  if (!viewerPlayerId && row.owner_id !== userId)
    throw new HttpError(404, "not_found", "Match not found");
  return {
    matchId,
    userId,
    ownerId: row.owner_id,
    viewerPlayerId,
    state: row.internal_state,
    rng: decodeRng(row.rng_state),
    deadline: row.phase_deadline ? row.phase_deadline.getTime() : null,
  };
}

/** Persist a transition atomically: canonical state, public mirrors, public events. */
export async function saveMatch(
  tx: Tx,
  matchId: string,
  runtime: Runtime,
  events: GameEvent[],
): Promise<void> {
  const { state } = runtime;
  const finished = state.phase === "end";
  await tx`
    update public.matches set
      phase = ${state.phase}, round_number = ${state.round}, version = ${state.version},
      status = ${finished ? "finished" : "active"},
      finished_at = ${finished ? tx`now()` : null}
    where id = ${matchId}`;
  for (const p of state.players) {
    await tx`update public.match_players set hp = ${p.hp}, status = ${p.status} where id = ${p.id} and match_id = ${matchId}`;
  }
  await tx`
    update private.match_runtime set
      internal_state = ${tx.json(state as never)},
      rng_state = ${encodeRng(runtime.rng)},
      phase_deadline = ${runtime.deadline === null ? null : new Date(runtime.deadline)}
    where match_id = ${matchId}`;
  if (events.length > 0) {
    const [seq] = await tx<{ next: string }[]>`
      select coalesce(max(event_seq), 0) + 1 as next from public.match_events where match_id = ${matchId}`;
    const rows = events.map((e, i) => ({
      match_id: matchId,
      event_seq: Number(seq?.next ?? 1) + i,
      round_number: e.round,
      event_type: e.type,
      public_payload: e.publicPayload,
    }));
    await tx`insert into public.match_events ${tx(rows as never)}`;
  }
}

export async function recentEvents(tx: Tx, matchId: string, round: number): Promise<GameEvent[]> {
  const rows = await tx<
    { round_number: number; event_type: string; public_payload: Record<string, unknown> }[]
  >`
    select round_number, event_type, public_payload from public.match_events
    where match_id = ${matchId} and round_number >= ${Math.max(0, round - 1)}
    order by event_seq limit 300`;
  return rows.map((r) => ({
    type: r.event_type,
    round: r.round_number,
    publicPayload: r.public_payload,
  }));
}

export interface MatchResponse {
  mode: GameState["mode"];
  currentSeat: { playerId: string; displayName: string } | null;
  view: PlayerGameView;
  viewerPlayerId: string | null;
  deadline: string | null;
}
