import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  CommandError,
  initializeMatch,
  STARTER_DECK_V4,
  type Command,
  type MatchState,
  type Transition,
  type UnitInstance,
} from "../src/rules/v4/index.ts";

export const rng = () => createSeededRandom([5, 6, 7, 8]);

export const obj = (instanceId: string, cardId: string, exhausted = false): UnitInstance => ({
  instanceId,
  cardId,
  damage: 0,
  exhausted,
  activeUsed: false,
  sleepAtEnd: false,
  hpBonus: 0,
  mods: [],
});

/** Active match where seat 0 ("me") is on turn in Main Phase with 8 SPARK. */
export function board(mine: UnitInstance[], theirs: UnitInstance[]): MatchState {
  const r = rng();
  let s = initializeMatch(
    { playerIds: ["me", "foe"], decks: [STARTER_DECK_V4, STARTER_DECK_V4] },
    r,
  );
  s = applyCommand(s, { type: "mulligan", playerId: "me", instanceIds: [] }, r).state;
  s = applyCommand(s, { type: "mulligan", playerId: "foe", instanceIds: [] }, r).state;
  s.activeSeat = 0;
  s.phase = "main";
  s.turn = 3;
  s.players[0].spark = 8;
  s.players[0].maxSpark = 8;
  s.players[0].units = mine;
  s.players[1].units = theirs;
  return s;
}

type Cmd = Command extends infer C ? (C extends Command ? Omit<C, "playerId"> : never) : never;

export const play = (s: MatchState, c: Cmd, who: "me" | "foe" = "me"): Transition =>
  applyCommand(s, { ...c, playerId: who }, rng());

export function at<T>(items: readonly T[], i: number): T {
  const v = items[i];
  if (v === undefined) throw new Error(`missing item ${String(i)}`);
  return v;
}

export function errorOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof CommandError) return e.code;
    throw e;
  }
  return "none";
}

/** Puts a card from the deck into seat 0's hand and returns its instance id. */
export function giveCard(s: MatchState, cardId: string): string {
  const id = `test-${cardId}-${String(s.players[0].hand.length)}`;
  s.players[0].hand.push({ instanceId: id, cardId });
  return id;
}
