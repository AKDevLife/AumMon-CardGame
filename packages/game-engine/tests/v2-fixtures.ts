import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  CommandError,
  initializeMatch,
  STARTER_DECK_V2,
  type Command,
  type MatchState,
  type UnitInstance,
} from "../src/rules/v2/index.ts";

export const rng = () => createSeededRandom([5, 6, 7, 8]);

export const unit = (instanceId: string, cardId: string, exhausted = false): UnitInstance => ({
  instanceId,
  cardId,
  damage: 0,
  exhausted,
  equipment: [],
  history: [],
  bonusKeywords: [],
  tempAtk: 0,
  boostUsed: false,
});

/** Active match where seat 0 ("me") is on turn with 8 SPARK. */
export function board(mine: UnitInstance[], theirs: UnitInstance[]): MatchState {
  const r = rng();
  let s = initializeMatch(
    { playerIds: ["me", "foe"], decks: [STARTER_DECK_V2, STARTER_DECK_V2] },
    r,
  );
  s = applyCommand(s, { type: "mulligan", playerId: "me", instanceIds: [] }, r).state;
  s = applyCommand(s, { type: "mulligan", playerId: "foe", instanceIds: [] }, r).state;
  s.activeSeat = 0;
  s.phase = "main";
  s.players[0].spark = 8;
  s.players[0].units = mine;
  s.players[1].units = theirs;
  return s;
}

export type Intent = Command extends infer C
  ? C extends Command
    ? Omit<C, "playerId">
    : never
  : never;

export const run = (s: MatchState, c: Intent) => applyCommand(s, { ...c, playerId: "me" }, rng());

export function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    if (e instanceof CommandError) return e.code;
    throw e;
  }
  return undefined;
}
