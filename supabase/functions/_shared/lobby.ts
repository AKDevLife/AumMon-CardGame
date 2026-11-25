/** Online lobby (blueprint §6.3): join codes are random, stored only as SHA-256, expire, and are rate-limited. */
import { parseSettings } from "./content.ts";
import { db } from "./db.ts";
import { enabledGame } from "./game.ts";
import { HttpError } from "./http.ts";
import { rateLimit } from "./ratelimit.ts";
import { hashRequest } from "./receipts.ts";
import type { Tx } from "./store.ts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const CODE_LENGTH = 8; // 32^8 ≈ 1.1e12 combinations
const LOBBY_TTL_MINUTES = 30;

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

async function displayName(tx: Tx, userId: string) {
  const [p] = await tx<
    { display_name: string }[]
  >`select display_name from public.profiles where id = ${userId}`;
  return p?.display_name ?? "Player";
}

/** Private online room (join code) for any enabled game, within the game's seat limits. */
export async function createOnlineRoom(
  userId: string,
  maxPlayers?: number,
  gameId = "edo_battle",
  rawSettings?: unknown,
) {
  const settings = parseSettings(rawSettings);
  await rateLimit(userId, "room.create", 10, 60); // outside the transaction (own connection)
  return db().begin(async (tx) => {
    const game = await enabledGame(tx, gameId);
    const size = maxPlayers ?? Math.min(4, game.maxPlayers);
    if (size < game.minPlayers || size > game.maxPlayers)
      throw new HttpError(400, "invalid_input", "maxPlayers out of range for this game");
    const code = newCode();
    const [room] = await tx<{ id: string }[]>`
      insert into public.game_rooms (owner_id, game_id, join_code_hash, mode, status, max_players, ruleset_version, expires_at, settings)
      values (${userId}, ${game.id}, ${await hashRequest(code)}, 'online', 'lobby', ${size}, ${game.rulesetVersion}, now() + ${`${LOBBY_TTL_MINUTES} minutes`}::interval, ${tx.json(settings as never)})
      returning id`;
    if (!room) throw new Error("room insert failed");
    await tx`
      insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot, status)
      values (${room.id}, ${userId}, 1, 'human', ${await displayName(tx, userId)}, 'ready')`;
    // The plaintext code is returned once to the owner and never stored.
    return { roomId: room.id, joinCode: code };
  });
}

export async function joinRoom(userId: string, rawCode: string) {
  await rateLimit(userId, "room.join", 10, 60);
  return db().begin(async (tx) => {
    const code = normalizeCode(rawCode);
    if (code.length !== CODE_LENGTH)
      throw new HttpError(404, "room_not_found", "Room not found or expired");
    const [room] = await tx<{ id: string; max_players: number }[]>`
      select id, max_players from public.game_rooms
      where join_code_hash = ${await hashRequest(code)} and mode = 'online'
        and status = 'lobby' and expires_at > now()
        and exists (select 1 from public.games g where g.id = public.game_rooms.game_id and g.is_enabled and g.current_ruleset = public.game_rooms.ruleset_version)
      for update`;
    if (!room) throw new HttpError(404, "room_not_found", "Room not found or expired");
    const seats = await tx<{ seat: number; user_id: string | null }[]>`
      select seat, user_id from public.room_players where room_id = ${room.id} and status <> 'left'`;
    if (seats.some((s) => s.user_id === userId)) return { roomId: room.id };
    if (seats.length >= room.max_players) throw new HttpError(409, "room_full", "Room is full");
    const used = new Set(seats.map((s) => s.seat));
    const seat =
      Array.from({ length: room.max_players }, (_, i) => i + 1).find((n) => !used.has(n)) ?? 0;
    await tx`delete from public.room_players where room_id = ${room.id} and seat = ${seat} and status = 'left'`;
    await tx`
      insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot, status)
      values (${room.id}, ${userId}, ${seat}, 'human', ${await displayName(tx, userId)}, 'waiting')`;
    return { roomId: room.id };
  });
}

export async function setReady(userId: string, roomId: string, ready: boolean) {
  return db().begin(async (tx) => {
    const rows = await tx`
      update public.room_players rp set status = ${ready ? "ready" : "waiting"}
      from public.game_rooms r
      where rp.room_id = ${roomId} and rp.user_id = ${userId} and r.id = rp.room_id and r.status = 'lobby' and rp.status <> 'left'
      returning rp.id`;
    if (rows.length === 0) throw new HttpError(404, "not_in_lobby", "You are not in this lobby");
    return { ok: true };
  });
}

export async function leaveRoom(userId: string, roomId: string) {
  return db().begin(async (tx) => {
    const [room] = await tx<{ owner_id: string; status: string }[]>`
      select owner_id, status from public.game_rooms where id = ${roomId} for update`;
    if (room?.status !== "lobby") throw new HttpError(404, "not_in_lobby", "Lobby not found");
    if (room.owner_id === userId) {
      await tx`update public.game_rooms set status = 'closed' where id = ${roomId}`;
    } else {
      await tx`delete from public.room_players where room_id = ${roomId} and user_id = ${userId}`;
    }
    return { ok: true };
  });
}
