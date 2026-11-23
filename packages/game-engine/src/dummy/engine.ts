import type { RandomSource } from "../rng/seeded-random.ts";
import { GameRuleError } from "../sdk/module.ts";

/**
 * Thai Dummy (ดัมมี่), ruleset "4" — docs/games/dummy/DUMMY_RULES.md. One round per match.
 * Pure and deterministic. Cards: rank + suit ("As", "Td", "2c").
 */
export type Card = string;
const RANKS = "A23456789TJQK";
const SUITS = "cdhs";

export const DUMMY_RULES = {
  minPlayers: 2,
  maxPlayers: 4,
  handSize: { 2: 11, 3: 9, 4: 7 } as Record<number, number>,
  speto: ["2c", "Qs"] as readonly Card[],
  spetoPoints: 50,
  headBonus: 50,
  knockBonus: 50,
  /** ทิ้งโง่: the next player picks only my last discard, melds it and knocks in that turn. */
  feedPenalty: 50,
  feedPenaltySpeto: 100,
  /** ทิ้งเต็ม: a discard that completes a meld with any 2 cards already in the pile. */
  fullPenalty: 50,
  fullPenaltySpeto: 100,
  turnTimeoutMs: 45_000,
  afkTimeouts: 2,
} as const;

export const rankNo = (c: Card) => RANKS.indexOf(c[0] ?? "") + 1; // A = 1 … K = 13
export const suitOf = (c: Card) => c[1] ?? "";

/** Card points: speto 50, A 15, 10-J-Q-K 10, 2–9 5. */
export function cardPoints(c: Card): number {
  if (DUMMY_RULES.speto.includes(c)) return DUMMY_RULES.spetoPoints;
  const r = rankNo(c);
  if (r === 1) return 15;
  return r >= 10 ? 10 : 5;
}

export interface Meld {
  readonly owner: number;
  cards: Card[];
}

export interface DummyPlayer {
  readonly playerId: string;
  hand: Card[];
  /** Points of cards this player put on the table (melds + lay-offs) and bonuses. */
  points: number;
  tookHead: boolean;
}

export interface DummyState {
  readonly rulesetVersion: "4";
  status: "active" | "finished";
  players: DummyPlayer[];
  stock: Card[];
  /** Discard pile, bottom → top (public). */
  discard: Card[];
  /** Per discard card: [seat that discarded it (-1 = head), turnNumber of the discard]. */
  discardFrom: [number, number][];
  /** The first face-up card (หัว); bonus for whoever melds it. */
  head: Card;
  melds: Meld[];
  current: number;
  phase: "draw" | "play";
  turnNumber: number;
  knocker: number | null;
  /** ทิ้งโง่ candidate this turn: the previous player's discard was picked alone. */
  feed: { from: number; card: Card } | null;
  /** Final scores (set when finished). */
  scores: number[] | null;
  winners: number[];
}

export type DummyCommand =
  | { readonly type: "draw" }
  /** Take discard[index..top]; discard[index] must go straight into `meld` (with hand cards) or onto meld `layoff`. */
  | {
      readonly type: "pick";
      readonly index: number;
      readonly meld?: readonly Card[];
      readonly layoff?: number;
    }
  | { readonly type: "meld"; readonly cards: readonly Card[] }
  | { readonly type: "layoff"; readonly meld: number; readonly cards: readonly Card[] }
  | { readonly type: "discard"; readonly card: Card };

export type DummyEvent =
  | { type: "dealt"; first: number; head: Card }
  | { type: "drew"; seat: number }
  | { type: "picked"; seat: number; cards: Card[]; head: boolean }
  | { type: "melded"; seat: number; cards: Card[]; meld: number }
  | { type: "laid_off"; seat: number; cards: Card[]; meld: number }
  | { type: "discarded"; seat: number; card: Card }
  | { type: "fed"; seat: number; card: Card; penalty: number }
  | { type: "full_discard"; seat: number; card: Card; penalty: number }
  | { type: "knock"; seat: number }
  | { type: "stock_out" }
  | { type: "game_over"; scores: number[]; winners: number[] }
  | { type: "timeout"; seat: number };

// ---------------------------------------------------------------- melds

/** Valid set (3–4 of a rank) or run (3+ same suit in sequence; A low or high, no wrap). */
export function isValidMeld(cards: readonly Card[]): boolean {
  if (cards.length < 3 || new Set(cards).size !== cards.length) return false;
  const ranks = cards.map(rankNo);
  if (ranks.every((r) => r === ranks[0])) return cards.length <= 4;
  if (!cards.every((c) => suitOf(c) === suitOf(cards[0] ?? ""))) return false;
  const consecutive = (rs: number[]) => {
    const s = [...rs].sort((a, b) => a - b);
    return s.every((r, i) => i === 0 || r === (s[i - 1] ?? 0) + 1);
  };
  return consecutive(ranks) || consecutive(ranks.map((r) => (r === 1 ? 14 : r)));
}

// ---------------------------------------------------------------- setup

function shuffle<T>(items: readonly T[], rng: RandomSource): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

export function newDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) d.push(r + s);
  return d;
}

export function startGame(
  playerIds: readonly string[],
  rng: RandomSource,
): { state: DummyState; events: DummyEvent[] } {
  const n = playerIds.length;
  const size = DUMMY_RULES.handSize[n];
  if (size === undefined) throw new Error("2–4 players");
  const deck = shuffle(newDeck(), rng);
  const players = playerIds.map((playerId) => ({
    playerId,
    hand: deck.splice(0, size),
    points: 0,
    tookHead: false,
  }));
  const head = deck.splice(0, 1)[0] ?? "";
  const first = rng.nextInt(n);
  const state: DummyState = {
    rulesetVersion: "4",
    status: "active",
    players,
    stock: deck,
    discard: [head],
    discardFrom: [[-1, 0]],
    head,
    melds: [],
    current: first,
    phase: "draw",
    turnNumber: 1,
    knocker: null,
    feed: null,
    scores: null,
    winners: [],
  };
  return { state, events: [{ type: "dealt", first, head }] };
}

// ---------------------------------------------------------------- helpers

function clone(s: DummyState): DummyState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hand: [...p.hand] })),
    stock: [...s.stock],
    discard: [...s.discard],
    discardFrom: s.discardFrom.map(([a, b]) => [a, b]),
    melds: s.melds.map((m) => ({ ...m, cards: [...m.cards] })),
    winners: [...s.winners],
    feed: s.feed ? { ...s.feed } : null,
    scores: s.scores ? [...s.scores] : null,
  };
}

function me(s: DummyState, seat: number): DummyPlayer {
  const p = s.players[seat];
  if (!p) throw new GameRuleError("unknown_player");
  return p;
}

function takeFromHand(p: DummyPlayer, cards: readonly Card[]): void {
  for (const c of cards) {
    const i = p.hand.indexOf(c);
    if (i < 0) throw new GameRuleError("card_not_in_hand");
    p.hand.splice(i, 1);
  }
}

const sum = (cards: readonly Card[]) => cards.reduce((a, c) => a + cardPoints(c), 0);

function finish(s: DummyState, ev: DummyEvent[]): void {
  s.status = "finished";
  s.scores = s.players.map(
    (p, i) => p.points - sum(p.hand) + (s.knocker === i ? DUMMY_RULES.knockBonus : 0),
  );
  const top = Math.max(...s.scores);
  s.winners = s.scores.flatMap((v, i) => (v === top ? [i] : []));
  ev.push({ type: "game_over", scores: [...s.scores], winners: [...s.winners] });
}

/** Hand emptied during the play phase: knock (round ends, knock bonus). */
function checkKnock(s: DummyState, seat: number, ev: DummyEvent[]): boolean {
  if (me(s, seat).hand.length > 0) return false;
  s.knocker = seat;
  ev.push({ type: "knock", seat });
  const feeder = s.feed ? s.players[s.feed.from] : undefined;
  if (s.feed && feeder) {
    const penalty = DUMMY_RULES.speto.includes(s.feed.card)
      ? DUMMY_RULES.feedPenaltySpeto
      : DUMMY_RULES.feedPenalty;
    feeder.points -= penalty;
    ev.push({ type: "fed", seat: s.feed.from, card: s.feed.card, penalty });
  }
  finish(s, ev);
  return true;
}

function nextTurn(s: DummyState, ev: DummyEvent[]): void {
  s.current = (s.current + 1) % s.players.length;
  s.phase = "draw";
  s.turnNumber += 1;
  s.feed = null;
  // No stock and nothing useful to pick: the round ends when the next player cannot draw.
  if (s.stock.length === 0) {
    ev.push({ type: "stock_out" });
    finish(s, ev);
  }
}

/** True when `card` forms a set or run with any two cards of `pile`. */
export function completesPileMeld(card: Card, pile: readonly Card[]): boolean {
  for (let i = 0; i < pile.length; i++)
    for (let j = i + 1; j < pile.length; j++)
      if (isValidMeld([card, pile[i] ?? "", pile[j] ?? ""])) return true;
  return false;
}

// ---------------------------------------------------------------- commands

export function applyCommand(
  state: DummyState,
  seat: number,
  command: DummyCommand,
): { state: DummyState; events: DummyEvent[] } {
  if (state.status === "finished") throw new GameRuleError("game_over");
  if (seat !== state.current) throw new GameRuleError("not_your_turn");
  const s = clone(state);
  const p = me(s, seat);
  const ev: DummyEvent[] = [];

  switch (command.type) {
    case "draw": {
      if (s.phase !== "draw") throw new GameRuleError("already_drew");
      const card = s.stock.pop();
      if (card === undefined) throw new GameRuleError("stock_empty");
      p.hand.push(card);
      s.phase = "play";
      ev.push({ type: "drew", seat });
      break;
    }
    case "pick": {
      if (s.phase !== "draw") throw new GameRuleError("already_drew");
      const { index } = command;
      if (!Number.isInteger(index) || index < 0 || index >= s.discard.length)
        throw new GameRuleError("invalid_pick");
      const target = s.discard[index] ?? "";
      const taken = s.discard.splice(index);
      const [from, turn] = s.discardFrom.splice(index)[0] ?? [-1, 0];
      const rest = taken.slice(1);
      const isHead = target === s.head && index === 0 && !s.players.some((x) => x.tookHead);
      if (command.meld) {
        const fromHand = command.meld.filter((c) => c !== target);
        if (fromHand.length !== command.meld.length - 1) throw new GameRuleError("invalid_meld");
        // Hand cards may include cards just picked from above the target.
        p.hand.push(...rest);
        takeFromHand(p, fromHand);
        const cards = [target, ...fromHand];
        if (!isValidMeld(cards)) throw new GameRuleError("invalid_meld");
        s.melds.push({ owner: seat, cards });
        p.points += sum(cards);
        ev.push({ type: "picked", seat, cards: taken, head: isHead });
        ev.push({ type: "melded", seat, cards, meld: s.melds.length - 1 });
      } else if (command.layoff !== undefined) {
        const m = s.melds[command.layoff];
        if (!m || !isValidMeld([...m.cards, target])) throw new GameRuleError("invalid_layoff");
        m.cards.push(target);
        p.hand.push(...rest);
        p.points += cardPoints(target);
        ev.push({ type: "picked", seat, cards: taken, head: isHead });
        ev.push({ type: "laid_off", seat, cards: [target], meld: command.layoff });
      } else throw new GameRuleError("pick_needs_meld");
      // ทิ้งโง่ candidate: only the previous player's last discard was taken (penalty if we knock now).
      const prev = (seat - 1 + s.players.length) % s.players.length;
      if (taken.length === 1 && from === prev && from !== seat && turn === s.turnNumber - 1)
        s.feed = { from, card: target };
      if (isHead) {
        p.tookHead = true;
        p.points += DUMMY_RULES.headBonus;
      }
      s.phase = "play";
      checkKnock(s, seat, ev);
      break;
    }
    case "meld": {
      if (s.phase !== "play") throw new GameRuleError("draw_first");
      if (!isValidMeld(command.cards)) throw new GameRuleError("invalid_meld");
      takeFromHand(p, command.cards);
      s.melds.push({ owner: seat, cards: [...command.cards] });
      p.points += sum(command.cards);
      ev.push({ type: "melded", seat, cards: [...command.cards], meld: s.melds.length - 1 });
      checkKnock(s, seat, ev);
      break;
    }
    case "layoff": {
      if (s.phase !== "play") throw new GameRuleError("draw_first");
      const m = s.melds[command.meld];
      if (!m || command.cards.length === 0 || !isValidMeld([...m.cards, ...command.cards]))
        throw new GameRuleError("invalid_layoff");
      takeFromHand(p, command.cards);
      m.cards.push(...command.cards);
      p.points += sum(command.cards);
      ev.push({ type: "laid_off", seat, cards: [...command.cards], meld: command.meld });
      checkKnock(s, seat, ev);
      break;
    }
    case "discard": {
      if (s.phase !== "play") throw new GameRuleError("draw_first");
      takeFromHand(p, [command.card]);
      // ทิ้งเต็ม (not on the knock card: the round ends with it).
      if (p.hand.length > 0 && completesPileMeld(command.card, s.discard)) {
        const penalty = DUMMY_RULES.speto.includes(command.card)
          ? DUMMY_RULES.fullPenaltySpeto
          : DUMMY_RULES.fullPenalty;
        p.points -= penalty;
        ev.push({ type: "full_discard", seat, card: command.card, penalty });
      }
      s.discard.push(command.card);
      s.discardFrom.push([seat, s.turnNumber]);
      ev.push({ type: "discarded", seat, card: command.card });
      if (!checkKnock(s, seat, ev)) nextTurn(s, ev);
      break;
    }
  }
  return { state: s, events: ev };
}

export function actingSeat(s: DummyState): number | null {
  return s.status === "finished" ? null : s.current;
}
