import { describe, expect, it } from "vitest";
import type { GameState } from "../src/domain/types.ts";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import { RULESET_V1 } from "../src/rules/v1/constants.ts";
import { countCards, discardFromHand, drawCard, shuffle } from "../src/rules/v1/deck.ts";
import { initializeMatch, SetupError } from "../src/rules/v1/setup.ts";
import { matchInput } from "./fixtures.ts";

const rng = () => createSeededRandom([11, 22, 33, 44]);
const setup = (ids?: string[]): GameState => initializeMatch(matchInput(ids), rng()).state;

describe("initializeMatch", () => {
  it("deals 3 cards to every player and keeps 40 cards", () => {
    const state = setup(["pyro_pup", "aqua_otter", "breeze_kit", "terra_tortoise"]);
    for (const p of state.players) expect(state.hands[p.id]).toHaveLength(3);
    expect(state.deck).toHaveLength(40 - 12);
    expect(countCards(state)).toBe(40);
  });

  it("uses character stats from definitions (spec §3)", () => {
    const state = setup(["terra_tortoise", "breeze_kit"]);
    expect(state.players.map((p) => [p.characterId, p.hp, p.maxHp, p.speed])).toEqual([
      ["terra_tortoise", 4, 4, 40],
      ["breeze_kit", 3, 3, 90],
    ]);
  });

  it("is deterministic for the same seed", () => {
    expect(setup().deck).toEqual(setup().deck);
  });

  it.each([
    [["pyro_pup"], "2–4 players"],
    [["pyro_pup", "pyro_pup"], "unique per match"],
  ])("rejects invalid setup %#", (ids, message) => {
    expect(() => initializeMatch(matchInput(ids), rng())).toThrow(SetupError);
    expect(() => initializeMatch(matchInput(ids), rng())).toThrow(message);
  });

  it("rejects a deck that is not 40 cards", () => {
    const input = matchInput();
    input.cards.pop();
    expect(() => initializeMatch(input, rng())).toThrow("40 cards");
  });
});

describe("drawCard (Rules 7–8)", () => {
  it("draws from the top of the deck", () => {
    const state = setup();
    const top = state.deck[0];
    expect(drawCard(state, "p1", rng())).toBe("drawn");
    expect(state.hands["p1"]?.at(-1)).toBe(top);
  });

  it("skips the draw when the hand is full (Rule 7)", () => {
    const state = setup();
    drawCard(state, "p1", rng());
    drawCard(state, "p1", rng());
    expect(state.hands["p1"]).toHaveLength(RULESET_V1.maxHand);
    expect(drawCard(state, "p1", rng())).toBe("hand_full");
    expect(state.hands["p1"]).toHaveLength(5);
  });

  it("reshuffles the discard pile into an empty deck (Rule 8)", () => {
    const state = setup();
    state.discard = [...state.deck];
    state.deck = [];
    const before = new Set(state.discard);
    expect(drawCard(state, "p1", rng())).toBe("drawn");
    expect(state.discard).toEqual([]);
    expect(before.has(state.hands["p1"]?.at(-1) ?? "")).toBe(true);
    expect(countCards(state)).toBe(40);
  });

  it("skips without error when deck and discard are empty (Rule 8)", () => {
    const state = setup();
    state.deck = [];
    state.discard = [];
    expect(drawCard(state, "p1", rng())).toBe("no_cards");
  });
});

describe("discard and shuffle", () => {
  it("moves a hand card to discard", () => {
    const state = setup();
    const card = state.hands["p1"]?.[0] ?? "";
    discardFromHand(state, "p1", card);
    expect(state.discard).toContain(card);
    expect(state.hands["p1"]).not.toContain(card);
    expect(() => {
      discardFromHand(state, "p1", card);
    }).toThrow();
  });

  it("shuffle returns a permutation without mutating input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, rng());
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort()).toEqual(input);
  });
});
