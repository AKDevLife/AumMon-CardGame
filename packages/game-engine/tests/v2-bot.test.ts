import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  chooseBotCommand,
  getLegalCommands,
  getPlayerView,
  initializeMatch,
  STARTER_DECK_V2,
  type Command,
  type LegalCommand,
  type MatchState,
  type Seat,
} from "../src/rules/v2/index.ts";
import { board, unit } from "./v2-fixtures.ts";

function toCommand(s: MatchState, seat: Seat, legal: LegalCommand): Command {
  const playerId = s.players[seat].playerId;
  return legal.type === "mulligan"
    ? { type: "mulligan", playerId, instanceIds: [] }
    : { ...legal, playerId };
}

/** Seat 0 = bot; seat 1 = bot too when `mirror`, otherwise uniform random. Returns winner seat or "draw". */
function play(seed: number, mirror: boolean): Seat | "draw" {
  const rng = createSeededRandom([seed, 11, 13, 17]);
  const pick = createSeededRandom([seed, 19, 23, 29]);
  let s = initializeMatch(
    { playerIds: ["bot", "other"], decks: [STARTER_DECK_V2, STARTER_DECK_V2] },
    rng,
  );
  for (let n = 0; s.status !== "finished"; n++) {
    if (n > 3000) throw new Error("match did not finish");
    const seat: Seat = s.status === "mulligan" ? (s.players[0].mulliganDone ? 1 : 0) : s.activeSeat;
    const legal = getLegalCommands(s, seat);
    const choice =
      seat === 0 || mirror
        ? chooseBotCommand(getPlayerView(s, seat), legal, pick)
        : legal[pick.nextInt(legal.length)];
    if (!choice) throw new Error("no choice");
    expect(legal).toContainEqual(choice);
    s = applyCommand(s, toCommand(s, seat, choice), rng).state;
  }
  if (!s.result) throw new Error("no result");
  return "draw" in s.result ? "draw" : s.result.winner;
}

describe("ruleset 2 bot", () => {
  it("beats a random player in most of 100 matches", () => {
    let wins = 0;
    for (let seed = 1; seed <= 100; seed++) if (play(seed, false) === 0) wins++;
    expect(wins).toBeGreaterThanOrEqual(80);
  });

  it("bot vs bot matches always finish", () => {
    for (let seed = 1; seed <= 30; seed++) expect([0, 1, "draw"]).toContain(play(seed, true));
  });

  it("takes lethal when available", () => {
    const s = board([unit("a", "U105_ROCKET_SKATEBOARD")], []);
    s.players[1].hp = 5;
    s.players[0].hand = [{ instanceId: "h", cardId: "U001_RUBBER_DUCKLING" }];
    const c = chooseBotCommand(
      getPlayerView(s, 0),
      getLegalCommands(s, 0),
      createSeededRandom([1, 2, 3, 4]),
    );
    expect(c).toEqual({ type: "attack", attackerId: "a", target: "player" });
  });

  it("only uses data from its own view", () => {
    const s = board([], []);
    const view = getPlayerView(s, 0);
    expect(view).not.toHaveProperty("players.1.hand");
    expect(() => chooseBotCommand(view, [], createSeededRandom([1, 2, 3, 4]))).toThrow();
  });
});
