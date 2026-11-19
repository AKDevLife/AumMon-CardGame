/** Room & match creation and the standard command pipeline (load → act → advance → save → view). */
import {
  buildPlayerView,
  createSeededRandom,
  initializeMatch,
  type CardEffect,
  type CardInstance,
  type CardType,
  type CharacterDefinition,
  type CharacterHook,
  type GameEvent,
  type GameState,
  type MatchMode,
  type PlayerKind,
  type RngState,
} from "@aummon/game-engine";
import { db } from "./db.ts";
import { advance, type Runtime } from "./flow.ts";
import { HttpError } from "./http.ts";
import {
  encodeRng,
  lockMatch,
  recentEvents,
  saveMatch,
  type LockedMatch,
  type MatchResponse,
  type Tx,
} from "./store.ts";

const EFFECT_BY_DEFINITION: Readonly<Record<string, CardEffect>> = {
  attack: "attack",
  defense: "defense",
  support: "support",
  chaos_redirect: "redirect",
  chaos_aoe: "aoe",
  chaos_disrupt: "disrupt",
};

function cryptoSeed(): RngState {
  const s = crypto.getRandomValues(new Uint32Array(4));
  if (s.every((v) => v === 0)) s[0] = 1;
  return [s[0] ?? 1, s[1] ?? 0, s[2] ?? 0, s[3] ?? 0];
}

interface CharacterRow {
  id: string;
  name: string;
  element: string;
  base_hp: number;
  speed: number;
  hook: CharacterHook;
  effect_key: string;
  description: string;
  definition_version: number;
}

const toCharacter = (r: CharacterRow): CharacterDefinition => ({
  id: r.id,
  name: r.name,
  element: r.element,
  hp: r.base_hp,
  speed: r.speed,
  hook: r.hook,
  effectKey: r.effect_key,
  description: r.description,
  version: r.definition_version,
});

/** Solo room: caller in seat 1, server bots fill the other seats with distinct characters. */
export async function createSoloRoom(
  userId: string,
  characterId: string,
  botCount: number,
): Promise<string> {
  return db().begin(async (tx) => {
    const chars = await tx<
      { id: string }[]
    >`select id from public.characters where is_enabled order by speed desc, id`;
    if (!chars.some((c) => c.id === characterId))
      throw new HttpError(400, "invalid_character", "Unknown character");
    const botChars = chars
      .map((c) => c.id)
      .filter((id) => id !== characterId)
      .slice(0, botCount);
    if (botChars.length < botCount)
      throw new HttpError(400, "not_enough_characters", "Too many bots");
    const [profile] = await tx<
      { display_name: string }[]
    >`select display_name from public.profiles where id = ${userId}`;
    const [room] = await tx<{ id: string }[]>`
      insert into public.game_rooms (owner_id, mode, status, max_players)
      values (${userId}, 'solo', 'lobby', ${botCount + 1}) returning id`;
    if (!room) throw new Error("room insert failed");
    await tx`
      insert into public.room_players (room_id, user_id, seat, player_type, character_id, display_name_snapshot, status)
      values (${room.id}, ${userId}, 1, 'human', ${characterId}, ${profile?.display_name ?? "Player"}, 'ready')`;
    for (const [i, id] of botChars.entries()) {
      await tx`
        insert into public.room_players (room_id, seat, player_type, character_id, display_name_snapshot, status)
        values (${room.id}, ${i + 2}, 'bot', ${id}, ${`Bot ${i + 1}`}, 'ready')`;
    }
    return room.id;
  });
}

/** Start a match from a lobby room (owner only). Builds the engine state server-side. */
export async function startMatch(
  userId: string,
  roomId: string,
): Promise<MatchResponse & { matchId: string }> {
  return db().begin(async (tx) => {
    const [room] = await tx<{ owner_id: string; mode: MatchMode; status: string }[]>`
      select owner_id, mode, status from public.game_rooms where id = ${roomId} for update`;
    if (room?.owner_id !== userId) throw new HttpError(404, "not_found", "Room not found");
    if (room.status !== "lobby")
      throw new HttpError(409, "room_not_in_lobby", "Room already started");

    const seats = await tx<
      (CharacterRow & {
        room_player_id: string;
        seat: number;
        player_type: PlayerKind;
        user_id: string | null;
        display_name_snapshot: string;
      })[]
    >`
      select rp.id as room_player_id, rp.seat, rp.player_type, rp.user_id, rp.display_name_snapshot,
             c.id, c.name, c.element, c.base_hp, c.speed, c.hook, c.effect_key, c.description, c.definition_version
      from public.room_players rp join public.characters c on c.id = rp.character_id
      where rp.room_id = ${roomId} and rp.status <> 'left' order by rp.seat`;
    const [deck] = await tx<{ id: string; version: number }[]>`
      select id, version from public.deck_templates where id = 'standard' and is_active`;
    if (!deck) throw new Error("No active standard deck");
    const deckCards = await tx<
      { id: string; name: string; card_type: CardType; quantity: number }[]
    >`
      select c.id, c.name, c.card_type, t.quantity
      from public.deck_template_cards t join public.card_definitions c on c.id = t.card_definition_id
      where t.deck_template_id = ${deck.id} and t.deck_template_version = ${deck.version}`;

    const cards: CardInstance[] = deckCards.flatMap((c) => {
      const effect = EFFECT_BY_DEFINITION[c.id];
      if (!effect) throw new Error(`No engine effect for card ${c.id}`);
      return Array.from({ length: c.quantity }, () => ({
        id: crypto.randomUUID(),
        definitionId: c.id,
        type: c.card_type,
        effect,
        name: c.name,
      }));
    });

    const [match] = await tx<{ id: string }[]>`
      insert into public.matches (room_id, deck_template_id, deck_template_version, status, engine_version, ruleset_version, started_at)
      values (${roomId}, ${deck.id}, ${deck.version}, 'active', '', '', now()) returning id`;
    if (!match) throw new Error("match insert failed");

    const playerIds = seats.map(() => crypto.randomUUID());
    const seed = cryptoSeed();
    const rng = createSeededRandom(seed);
    const init = initializeMatch(
      {
        matchId: match.id,
        mode: room.mode,
        seats: seats.map((s, i) => ({
          playerId: playerIds[i] ?? "",
          seat: s.seat,
          kind: s.player_type,
          displayName: s.display_name_snapshot,
          character: toCharacter(s),
        })),
        cards,
      },
      rng,
    );
    await tx`update public.matches set engine_version = ${init.state.engineVersion}, ruleset_version = ${init.state.rulesetVersion} where id = ${match.id}`;
    for (const [i, s] of seats.entries()) {
      const p = init.state.players.find((x) => x.seat === s.seat);
      if (!p) throw new Error("seat mismatch");
      await tx`
        insert into public.match_players (id, match_id, room_player_id, user_id, seat, player_type, character_id, character_snapshot, hp, max_hp, speed)
        values (${playerIds[i] ?? ""}, ${match.id}, ${s.room_player_id}, ${s.user_id}, ${s.seat}, ${s.player_type}, ${s.id},
                ${tx.json(toCharacter(s) as never)}, ${p.hp}, ${p.maxHp}, ${p.speed})`;
    }
    await tx`
      insert into private.match_runtime (match_id, rng_state, internal_state)
      values (${match.id}, ${encodeRng(rng.getState())}, ${tx.json(init.state as never)})`;
    await tx`update public.game_rooms set status = 'playing' where id = ${roomId}`;

    const locked = await lockMatch(tx, match.id, userId);
    const next = advance(locked, Date.now());
    await saveMatch(tx, match.id, next, [...init.events, ...next.events]);
    return { matchId: match.id, ...(await respond(tx, locked, next)) };
  });
}

export async function respond(
  tx: Tx,
  locked: LockedMatch,
  runtime: Runtime,
): Promise<MatchResponse> {
  const events = await recentEvents(tx, locked.matchId, runtime.state.round);
  return {
    view: buildPlayerView(runtime.state, locked.viewerPlayerId, events),
    deadline: runtime.deadline === null ? null : new Date(runtime.deadline).toISOString(),
  };
}

/**
 * Standard pipeline: lock → (optional command) → advance (bots/timeouts/resolve) → save → filtered view.
 */
export async function withMatch(
  userId: string,
  matchId: string,
  act?: (locked: LockedMatch) => { state: GameState; events: GameEvent[] },
): Promise<MatchResponse> {
  return db().begin(async (tx) => {
    const locked = await lockMatch(tx, matchId, userId);
    const acted = act ? act(locked) : { state: locked.state, events: [] };
    const next = advance({ ...locked, state: acted.state }, Date.now());
    const events = [...acted.events, ...next.events];
    if (acted.state !== locked.state || events.length > 0)
      await saveMatch(tx, matchId, next, events);
    return respond(tx, locked, next);
  });
}
