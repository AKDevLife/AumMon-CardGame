import type {
  CardInstance,
  CharacterDefinition,
  GameState,
  MatchMode,
  PlayerKind,
  PlayerState,
  RandomSource,
  Transition,
} from "../../domain/types.ts";
import { ENGINE_VERSION, RULESET_VERSION } from "../../version.ts";
import { RULESET_V1 } from "./constants.ts";
import { drawCard, shuffle } from "./deck.ts";

export interface SeatInput {
  playerId: string;
  seat: number;
  kind: PlayerKind;
  displayName: string;
  character: CharacterDefinition;
}

export interface InitializeMatchInput {
  matchId: string;
  mode: MatchMode;
  seats: SeatInput[];
  /** Card instances for this match (snapshots of the deck template, ids assigned by the adapter). */
  cards: CardInstance[];
}

export class SetupError extends Error {
  override name = "SetupError";
}

function validate(input: InitializeMatchInput): void {
  const { seats, cards } = input;
  const { minPlayers, maxPlayers, deckSize } = RULESET_V1;
  if (seats.length < minPlayers || seats.length > maxPlayers) {
    throw new SetupError(`Match needs ${minPlayers}–${maxPlayers} players, got ${seats.length}`);
  }
  const seatNumbers = new Set(seats.map((s) => s.seat));
  if (seatNumbers.size !== seats.length || seats.some((s) => s.seat < 1 || s.seat > maxPlayers)) {
    throw new SetupError("Seats must be unique and within 1–4");
  }
  if (new Set(seats.map((s) => s.playerId)).size !== seats.length) {
    throw new SetupError("Player ids must be unique");
  }
  if (new Set(seats.map((s) => s.character.id)).size !== seats.length) {
    throw new SetupError("Characters must be unique per match (clarification Q10)");
  }
  if (cards.length !== deckSize) throw new SetupError(`Deck must have ${deckSize} cards`);
  if (new Set(cards.map((c) => c.id)).size !== cards.length) {
    throw new SetupError("Card instance ids must be unique");
  }
}

/** Create the initial state: shuffled shared deck, 3 cards per player (spec §2). */
export function initializeMatch(input: InitializeMatchInput, rng: RandomSource): Transition {
  validate(input);
  const players: PlayerState[] = [...input.seats]
    .sort((a, b) => a.seat - b.seat)
    .map((s) => ({
      id: s.playerId,
      seat: s.seat,
      kind: s.kind,
      displayName: s.displayName,
      characterId: s.character.id,
      hook: s.character.hook,
      effectKey: s.character.effectKey,
      hp: s.character.hp,
      maxHp: s.character.hp,
      speed: s.character.speed,
      status: "alive",
      skillState: {},
    }));

  const state: GameState = {
    matchId: input.matchId,
    mode: input.mode,
    rulesetVersion: RULESET_VERSION,
    engineVersion: ENGINE_VERSION,
    phase: "setup",
    round: 0,
    version: 0,
    players,
    cards: Object.fromEntries(input.cards.map((c) => [c.id, { ...c }])),
    deck: shuffle(
      input.cards.map((c) => c.id),
      rng,
    ),
    discard: [],
    hands: Object.fromEntries(players.map((p) => [p.id, []])),
    submissions: {},
    result: { status: "ongoing" },
  };

  for (let i = 0; i < RULESET_V1.initialHand; i++) {
    for (const player of players) drawCard(state, player.id, rng);
  }

  return {
    state,
    events: [
      {
        type: "match.initialized",
        round: 0,
        publicPayload: {
          players: players.map((p) => ({ id: p.id, seat: p.seat, characterId: p.characterId })),
          handSize: RULESET_V1.initialHand,
        },
      },
    ],
  };
}
