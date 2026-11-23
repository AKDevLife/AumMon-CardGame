import type { RandomSource } from "../rng/seeded-random.ts";
import { GameRuleError } from "../sdk/module.ts";
import { evaluate, newDeck, type Card, type Category } from "./cards.ts";

/**
 * Texas Hold'em, No-Limit, play-money (docs/games/poker/POKER_RULES.md, ruleset "1").
 * A match is a sit-and-go: everyone starts with the same table stack; it ends when one player
 * holds all chips or after POKER_RULES.maxHands (highest stack wins). Pure and deterministic.
 */
export const POKER_RULES = {
  minPlayers: 2,
  maxPlayers: 8,
  startingStack: 1000,
  smallBlind: 10,
  bigBlind: 20,
  /** Blinds double every this many hands (keeps matches short). */
  blindLevelHands: 10,
  maxHands: 40,
  turnTimeoutMs: 30_000,
  afkTimeouts: 2,
} as const;

export type Street = "preflop" | "flop" | "turn" | "river";

export interface PokerPlayer {
  readonly playerId: string;
  stack: number;
  hole: Card[];
  /** Chips put in during the current street. */
  bet: number;
  /** Chips put in during the whole hand (for side pots). */
  total: number;
  folded: boolean;
  allIn: boolean;
  /** Acted since the last full raise (may then only call / fold an incomplete all-in raise). */
  acted: boolean;
  /** No chips left: out of the match. */
  out: boolean;
}

export interface HandSummary {
  readonly hand: number;
  readonly board: readonly Card[];
  /** Hole cards shown at showdown (public). */
  readonly shown: readonly { seat: number; cards: readonly Card[]; category: Category }[];
  readonly wins: readonly { seat: number; amount: number }[];
}

export interface PokerState {
  readonly rulesetVersion: "1";
  status: "active" | "finished";
  players: PokerPlayer[];
  deck: Card[];
  board: Card[];
  street: Street;
  dealer: number;
  current: number;
  /** Highest street bet to match. */
  currentBet: number;
  /** Size of the last full raise (minimum raise increment). */
  minRaise: number;
  hand: number;
  smallBlind: number;
  bigBlind: number;
  lastHand: HandSummary | null;
  winners: number[];
}

export type PokerCommand =
  | { readonly type: "fold" }
  | { readonly type: "check" }
  | { readonly type: "call" }
  /** Bet or raise so that this seat's street bet becomes `to`. */
  | { readonly type: "raise"; readonly to: number }
  | { readonly type: "all_in" };

export type PokerEvent =
  | { type: "hand_started"; hand: number; dealer: number; smallBlind: number; bigBlind: number }
  | { type: "blind"; seat: number; amount: number }
  | { type: "action"; seat: number; action: PokerCommand["type"]; amount: number }
  | { type: "street"; street: Street; board: Card[] }
  | { type: "showdown"; shown: { seat: number; cards: Card[]; category: Category }[] }
  | { type: "pot_won"; seat: number; amount: number }
  | { type: "game_over"; winners: number[] }
  | { type: "timeout"; seat: number };

const n = (s: PokerState) => s.players.length;

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

function clone(s: PokerState): PokerState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hole: [...p.hole] })),
    deck: [...s.deck],
    board: [...s.board],
    winners: [...s.winners],
  };
}

const p = (s: PokerState, seat: number): PokerPlayer => {
  const x = s.players[seat];
  if (!x) throw new GameRuleError("unknown_player");
  return x;
};

/** Next seat after `from` (clockwise) still in the match and matching `pred`. */
function nextSeat(s: PokerState, from: number, pred: (x: PokerPlayer) => boolean): number {
  for (let i = 1; i <= n(s); i++) {
    const seat = (from + i) % n(s);
    const x = s.players[seat];
    if (x && !x.out && pred(x)) return seat;
  }
  return -1;
}

const canAct = (x: PokerPlayer) => !x.folded && !x.allIn && !x.out;
const inHand = (x: PokerPlayer) => !x.folded && !x.out;

function put(s: PokerState, seat: number, amount: number): number {
  const x = p(s, seat);
  const paid = Math.min(amount, x.stack);
  x.stack -= paid;
  x.bet += paid;
  x.total += paid;
  if (x.stack === 0) x.allIn = true;
  return paid;
}

function startHand(s: PokerState, rng: RandomSource, ev: PokerEvent[]): void {
  s.hand += 1;
  const level = Math.floor((s.hand - 1) / POKER_RULES.blindLevelHands);
  s.smallBlind = POKER_RULES.smallBlind * 2 ** level;
  s.bigBlind = POKER_RULES.bigBlind * 2 ** level;
  s.deck = shuffle(newDeck(), rng);
  s.board = [];
  s.street = "preflop";
  for (const x of s.players) {
    x.hole = x.out ? [] : [s.deck.pop() ?? "", s.deck.pop() ?? ""];
    x.bet = 0;
    x.total = 0;
    x.folded = x.out;
    x.allIn = false;
    x.acted = false;
  }
  s.dealer = s.hand === 1 ? s.dealer : nextSeat(s, s.dealer, () => true);
  const active = s.players.filter((x) => !x.out).length;
  // Heads-up: the dealer posts the small blind and acts first preflop.
  const sb = active === 2 ? s.dealer : nextSeat(s, s.dealer, () => true);
  const bb = nextSeat(s, sb, () => true);
  ev.push({
    type: "hand_started",
    hand: s.hand,
    dealer: s.dealer,
    smallBlind: s.smallBlind,
    bigBlind: s.bigBlind,
  });
  ev.push({ type: "blind", seat: sb, amount: put(s, sb, s.smallBlind) });
  ev.push({ type: "blind", seat: bb, amount: put(s, bb, s.bigBlind) });
  s.currentBet = s.bigBlind;
  s.minRaise = s.bigBlind;
  s.current = nextSeat(s, bb, canAct);
  settle(s, rng, ev);
}

export function startGame(
  playerIds: readonly string[],
  rng: RandomSource,
): { state: PokerState; events: PokerEvent[] } {
  const count = playerIds.length;
  if (count < POKER_RULES.minPlayers || count > POKER_RULES.maxPlayers)
    throw new Error("2–8 players");
  const state: PokerState = {
    rulesetVersion: "1",
    status: "active",
    players: playerIds.map((playerId) => ({
      playerId,
      stack: POKER_RULES.startingStack,
      hole: [],
      bet: 0,
      total: 0,
      folded: false,
      allIn: false,
      acted: false,
      out: false,
    })),
    deck: [],
    board: [],
    street: "preflop",
    dealer: rng.nextInt(count),
    current: 0,
    currentBet: 0,
    minRaise: POKER_RULES.bigBlind,
    hand: 0,
    smallBlind: POKER_RULES.smallBlind,
    bigBlind: POKER_RULES.bigBlind,
    lastHand: null,
    winners: [],
  };
  const events: PokerEvent[] = [];
  startHand(state, rng, events);
  return { state, events };
}

/** Side pots from each seat's hand total; folded chips stay in but cannot win. */
export function pots(s: PokerState): { amount: number; eligible: number[] }[] {
  const levels = [
    ...new Set(s.players.filter((x) => x.total > 0 && inHand(x)).map((x) => x.total)),
  ].sort((a, b) => a - b);
  const out: { amount: number; eligible: number[] }[] = [];
  let prev = 0;
  for (const level of levels) {
    const amount = s.players.reduce(
      (sum, x) => sum + Math.max(0, Math.min(x.total, level) - prev),
      0,
    );
    const eligible = s.players.flatMap((x, i) => (inHand(x) && x.total >= level ? [i] : []));
    if (amount > 0) out.push({ amount, eligible });
    prev = level;
  }
  // Chips from folded players above the highest live level (cannot happen normally) go to the last pot.
  const counted = out.reduce((a, b) => a + b.amount, 0);
  const total = s.players.reduce((a, x) => a + x.total, 0);
  const last = out[out.length - 1];
  if (last && total > counted) last.amount += total - counted;
  return out;
}

function awardAndNext(s: PokerState, rng: RandomSource, ev: PokerEvent[]): void {
  const live = s.players.flatMap((x, i) => (inHand(x) ? [i] : []));
  const shown: { seat: number; cards: Card[]; category: Category }[] = [];
  const wins = new Map<number, number>();
  if (live.length === 1) {
    const seat = live[0] ?? 0;
    const total = s.players.reduce((a, x) => a + x.total, 0);
    wins.set(seat, total);
  } else {
    const value = new Map<number, number>();
    for (const seat of live) {
      const v = evaluate([...p(s, seat).hole, ...s.board]);
      value.set(seat, v.score);
      shown.push({ seat, cards: [...p(s, seat).hole], category: v.category });
    }
    ev.push({ type: "showdown", shown });
    for (const pot of pots(s)) {
      const best = Math.max(...pot.eligible.map((x) => value.get(x) ?? -1));
      // Winners in seat order starting left of the dealer (odd chips go to the first).
      const winners = pot.eligible
        .filter((x) => value.get(x) === best)
        .sort((a, b) => ((a - s.dealer - 1 + n(s)) % n(s)) - ((b - s.dealer - 1 + n(s)) % n(s)));
      const share = Math.floor(pot.amount / winners.length);
      let odd = pot.amount - share * winners.length;
      for (const w of winners) {
        wins.set(w, (wins.get(w) ?? 0) + share + (odd > 0 ? 1 : 0));
        if (odd > 0) odd--;
      }
    }
  }
  for (const [seat, amount] of [...wins.entries()].sort((a, b) => a[0] - b[0])) {
    p(s, seat).stack += amount;
    ev.push({ type: "pot_won", seat, amount });
  }
  s.lastHand = {
    hand: s.hand,
    board: [...s.board],
    shown,
    wins: [...wins.entries()].map(([seat, amount]) => ({ seat, amount })),
  };
  for (const x of s.players) {
    x.total = 0;
    x.bet = 0;
    if (x.stack === 0) x.out = true;
  }
  const alive = s.players.flatMap((x, i) => (x.out ? [] : [i]));
  if (alive.length <= 1 || s.hand >= POKER_RULES.maxHands) {
    const top = Math.max(...s.players.map((x) => x.stack));
    s.winners = s.players.flatMap((x, i) => (x.stack === top ? [i] : []));
    s.status = "finished";
    ev.push({ type: "game_over", winners: [...s.winners] });
    return;
  }
  startHand(s, rng, ev);
}

/** Ends streets / the hand when nobody needs to act. */
function settle(s: PokerState, rng: RandomSource, ev: PokerEvent[]): void {
  for (;;) {
    const live = s.players.filter(inHand);
    if (live.length <= 1) {
      awardAndNext(s, rng, ev);
      return;
    }
    const needs = (x: PokerPlayer) => canAct(x) && (!x.acted || x.bet < s.currentBet);
    const pending = s.players.some(needs);
    const actors = s.players.filter(canAct);
    // One player left to act who already matches the bet: nobody can bet against them.
    if (pending && !(actors.length === 1 && (actors[0]?.bet ?? 0) >= s.currentBet)) {
      if (!needs(p(s, s.current))) s.current = nextSeat(s, s.current, needs);
      return;
    }
    if (s.street === "river") {
      awardAndNext(s, rng, ev);
      return;
    }
    // Next street.
    const deal = s.street === "preflop" ? 3 : 1;
    s.street = s.street === "preflop" ? "flop" : s.street === "flop" ? "turn" : "river";
    s.deck.pop(); // burn
    for (let i = 0; i < deal; i++) s.board.push(s.deck.pop() ?? "");
    ev.push({ type: "street", street: s.street, board: [...s.board] });
    for (const x of s.players) {
      x.bet = 0;
      x.acted = false;
    }
    s.currentBet = 0;
    s.minRaise = s.bigBlind;
    s.current = nextSeat(s, s.dealer, canAct);
  }
}

export function actingSeat(s: PokerState): number | null {
  return s.status === "finished" ? null : s.current;
}

/** What `seat` may do now. */
export function legalActions(s: PokerState, seat: number) {
  const x = s.players[seat];
  if (s.status === "finished" || seat !== s.current || !x || !canAct(x)) return null;
  const toCall = Math.min(s.currentBet - x.bet, x.stack);
  const maxTo = x.bet + x.stack;
  const minTo = Math.min(s.currentBet + s.minRaise, maxTo);
  return {
    canCheck: toCall === 0,
    toCall,
    /** Raising is closed after an incomplete all-in raise for players who already acted. */
    canRaise: !x.acted && maxTo > s.currentBet,
    minTo,
    maxTo,
  };
}

export function applyCommand(
  state: PokerState,
  seat: number,
  command: PokerCommand,
  rng: RandomSource,
): { state: PokerState; events: PokerEvent[] } {
  if (state.status === "finished") throw new GameRuleError("game_over");
  if (seat !== state.current) throw new GameRuleError("not_your_turn");
  const s = clone(state);
  const legal = legalActions(s, seat);
  if (!legal) throw new GameRuleError("not_your_turn");
  const x = p(s, seat);
  const ev: PokerEvent[] = [];
  let to = x.bet;
  switch (command.type) {
    case "fold":
      x.folded = true;
      break;
    case "check":
      if (!legal.canCheck) throw new GameRuleError("cannot_check");
      break;
    case "call":
      if (legal.toCall === 0) throw new GameRuleError("nothing_to_call");
      to = x.bet + legal.toCall;
      break;
    case "raise":
      if (!legal.canRaise) throw new GameRuleError("cannot_raise");
      if (!Number.isInteger(command.to) || command.to < legal.minTo || command.to > legal.maxTo)
        throw new GameRuleError("invalid_amount");
      to = command.to;
      break;
    case "all_in":
      to = legal.maxTo;
      if (to > s.currentBet && !legal.canRaise) to = Math.min(to, s.currentBet);
      break;
  }
  const paid = put(s, seat, to - x.bet);
  x.acted = true;
  if (x.bet > s.currentBet) {
    const raise = x.bet - s.currentBet;
    if (raise >= s.minRaise) {
      // Full raise: everyone else must act again and may re-raise.
      s.minRaise = raise;
      for (const [i, o] of s.players.entries()) if (i !== seat && canAct(o)) o.acted = false;
    }
    s.currentBet = x.bet;
  }
  ev.push({ type: "action", seat, action: command.type, amount: paid });
  s.current = nextSeat(s, seat, (o) => canAct(o) && (!o.acted || o.bet < s.currentBet));
  if (s.current < 0) s.current = seat;
  settle(s, rng, ev);
  return { state: s, events: ev };
}
