import type { RandomSource } from "../rng/seeded-random.ts";
import { DISCARD_CARDS, DISCARD_RULES, getDiscardCard, type AbilityId } from "./cards.ts";

/**
 * Casual Discard Edition engine (docs/discard/AumMon_Core_Rules.md). Pure and deterministic:
 * every command returns a new state + events; randomness comes from the injected RandomSource.
 */
export type Seat = number;

export interface CardInstance {
  readonly id: string;
  readonly cardId: string;
}

export interface PlayerState {
  readonly playerId: string;
  hand: CardInstance[];
}

/** A draw / skip aimed at a player who may answer with Umbrella (Core Rules §6). */
export interface PendingHit {
  readonly kind: "draw" | "skip";
  readonly target: Seat;
  readonly amount: number;
}

export interface GameState {
  readonly rulesetVersion: "7";
  status: "active" | "finished";
  players: PlayerState[];
  drawPile: CardInstance[];
  pile: CardInstance[];
  /** Cards removed from the game (Scissors, Trash). */
  removed: CardInstance[];
  direction: 1 | -1;
  /** Seat whose turn it is (during reactions: the player who caused them). */
  current: Seat;
  turnNumber: number;
  readonly firstSeat: Seat;
  /** Pile reset / Eraser: the next card may have any points. */
  open: boolean;
  lastPlayed: Seat | null;
  passStreak: number;
  glue: Seat | null;
  ruler: { readonly seat: Seat; readonly value: number } | null;
  skip: Seat | null;
  /** Umbrella decisions still awaited, in order. */
  reactions: PendingHit[];
  winner: Seat | null;
}

export type GameEvent =
  | { type: "game_started"; firstSeat: Seat; top: string }
  | { type: "played"; seat: Seat; cardIds: string[]; ability: boolean }
  | { type: "ability"; seat: Seat; ability: AbilityId; target: Seat | null }
  | { type: "drew"; seat: Seat; count: number }
  | { type: "passed"; seat: Seat; forced: boolean }
  | { type: "skipped"; seat: Seat }
  | { type: "pile_reset"; seat: Seat }
  | { type: "direction"; direction: 1 | -1 }
  | { type: "umbrella"; seat: Seat; blocked: "draw" | "skip" }
  | { type: "card_given"; from: Seat; to: Seat }
  | { type: "removed"; seat: Seat; cardId: string }
  /** Flashlight: every hand is shown to every player (public by design). */
  | { type: "reveal_all"; hands: string[][] }
  /** Magnifier: PRIVATE — only `seat` may see `cards` (the server must filter it). */
  | { type: "peek"; seat: Seat; target: Seat; cards: string[]; private: true }
  | { type: "game_over"; winner: Seat };

export type CommandErrorCode =
  | "game_over"
  | "not_your_turn"
  | "unknown_player"
  | "awaiting_reaction"
  | "no_reaction"
  | "card_not_in_hand"
  | "cannot_play"
  | "invalid_target"
  | "invalid_choice";

export class CommandError extends Error {
  readonly code: CommandErrorCode;
  constructor(code: CommandErrorCode) {
    super(code);
    this.code = code;
    this.name = "CommandError";
  }
}

/** Choices for an ability, sent with the play (the client collects them first). */
export interface AbilityChoice {
  /** Glue, Magnifier, Flashlight: the chosen opponent. */
  readonly target?: Seat;
  /** Scissors: optional extra card; Box: card placed on the pile; Magnet: card given; Trash: card removed. */
  readonly card?: string;
  /** Tape: two cards of equal points. */
  readonly pair?: readonly [string, string];
}

export type Command =
  | {
      readonly type: "play";
      readonly playerId: string;
      readonly card: string;
      readonly useAbility: boolean;
      readonly choice?: AbilityChoice;
    }
  | { readonly type: "draw"; readonly playerId: string }
  | { readonly type: "react"; readonly playerId: string; readonly useUmbrella: boolean };

export interface Transition {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
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

export function buildDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const card of DISCARD_CARDS)
    for (let i = 0; i < DISCARD_RULES.copies; i++)
      deck.push({ id: `c${String(deck.length)}`, cardId: card.cardId });
  return deck;
}

/** Deal 7 (2–4 players) or 5 (5–8), flip a normal card to start, random first player. */
export function startGame(
  playerIds: readonly string[],
  rng: RandomSource,
): { state: GameState; events: GameEvent[] } {
  const n = playerIds.length;
  if (n < DISCARD_RULES.minPlayers || n > DISCARD_RULES.maxPlayers) throw new Error("2–8 players");
  const deck = shuffle(buildDeck(), rng);
  const size = n <= 4 ? DISCARD_RULES.handSmall : DISCARD_RULES.handLarge;
  const players = playerIds.map((playerId) => ({ playerId, hand: deck.splice(0, size) }));
  // Start on a normal number card (not Eraser / Umbrella) so the first play has a clear rule.
  const startIdx = deck.findIndex(
    (x) => !["eraser", "umbrella"].includes(getDiscardCard(x.cardId).ability),
  );
  const [start] = deck.splice(Math.max(0, startIdx), 1);
  if (!start) throw new Error("empty deck");
  const firstSeat = rng.nextInt(n);
  const state: GameState = {
    rulesetVersion: "7",
    status: "active",
    players,
    drawPile: deck,
    pile: [start],
    removed: [],
    direction: 1,
    current: firstSeat,
    turnNumber: 1,
    firstSeat,
    open: false,
    lastPlayed: null,
    passStreak: 0,
    glue: null,
    ruler: null,
    skip: null,
    reactions: [],
    winner: null,
  };
  return { state, events: [{ type: "game_started", firstSeat, top: start.cardId }] };
}

// ---------------------------------------------------------------- helpers

function clone(s: GameState): GameState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hand: [...p.hand] })),
    drawPile: [...s.drawPile],
    pile: [...s.pile],
    removed: [...s.removed],
    reactions: [...s.reactions],
  };
}

const n = (s: GameState) => s.players.length;
export const nextSeat = (s: GameState, from: Seat): Seat => (from + s.direction + n(s)) % n(s);
const points = (x: CardInstance) => getDiscardCard(x.cardId).points;
export const topCard = (s: GameState): CardInstance | undefined => s.pile[s.pile.length - 1];

function seatOf(s: GameState, playerId: string): Seat {
  const i = s.players.findIndex((p) => p.playerId === playerId);
  if (i < 0) throw new CommandError("unknown_player");
  return i;
}

function take(s: GameState, seat: Seat, id: string): CardInstance {
  const hand = s.players[seat]?.hand ?? [];
  const i = hand.findIndex((x) => x.id === id);
  const [card] = i < 0 ? [] : hand.splice(i, 1);
  if (!card) throw new CommandError("card_not_in_hand");
  return card;
}

function draw(s: GameState, seat: Seat, count: number, rng: RandomSource, ev: GameEvent[]): void {
  let got = 0;
  for (let i = 0; i < count; i++) {
    if (s.drawPile.length === 0 && s.pile.length > 1) {
      const top = s.pile.pop();
      s.drawPile = shuffle(s.pile, rng);
      s.pile = top ? [top] : [];
    }
    const card = s.drawPile.shift();
    if (!card) break;
    s.players[seat]?.hand.push(card);
    got++;
  }
  ev.push({ type: "drew", seat, count: got });
}

/** Can `card` be played by `seat` now? (Core Rules §4, Glue, Ruler, Eraser.) */
export function canPlay(s: GameState, seat: Seat, card: CardInstance): boolean {
  const def = getDiscardCard(card.cardId);
  if (def.ability === "eraser") return true;
  if (s.ruler?.seat === seat) return def.points === s.ruler.value;
  if (s.glue === seat && def.points < 4) return false;
  const top = topCard(s);
  return s.open || !top || def.points >= points(top);
}

function fewest(s: GameState, me: Seat): Seat | null {
  let best: Seat | null = null;
  for (let k = 1, seat = nextSeat(s, me); k < n(s); k++, seat = nextSeat(s, seat)) {
    const size = s.players[seat]?.hand.length ?? 0;
    if (best === null || size < (s.players[best]?.hand.length ?? 0)) best = seat;
  }
  return best;
}

function opponent(s: GameState, me: Seat, target: Seat | undefined): Seat {
  if (target === undefined || target === me || target < 0 || target >= n(s))
    throw new CommandError("invalid_target");
  return target;
}

// ---------------------------------------------------------------- abilities

function resolveAbility(
  s: GameState,
  me: Seat,
  ability: AbilityId,
  choice: AbilityChoice,
  rng: RandomSource,
  ev: GameEvent[],
  hits: PendingHit[],
  depth = 0,
): void {
  const hand = s.players[me]?.hand ?? [];
  let target: Seat | null = null;
  switch (ability) {
    case "next_draw":
      target = nextSeat(s, me);
      hits.push({ kind: "draw", target, amount: 1 });
      break;
    case "glue":
      target = opponent(s, me, choice.target);
      s.glue = target;
      break;
    case "eraser":
      s.open = true;
      s.glue = null;
      s.ruler = null;
      break;
    case "scissors": {
      const under = s.pile.splice(s.pile.length - 2, 1)[0];
      if (under) {
        s.removed.push(under);
        ev.push({ type: "removed", seat: me, cardId: under.cardId });
      }
      if (choice.card !== undefined) {
        const extra = hand.find((x) => x.id === choice.card);
        if (!extra || !canPlay(s, me, extra)) throw new CommandError("invalid_choice");
        s.pile.push(take(s, me, extra.id));
        ev.push({ type: "played", seat: me, cardIds: [extra.cardId], ability: false });
      }
      break;
    }
    case "box": {
      const under = s.pile.splice(s.pile.length - 2, 1)[0];
      if (choice.card === undefined || !hand.some((x) => x.id === choice.card))
        throw new CommandError("invalid_choice");
      const placed = take(s, me, choice.card);
      if (under) hand.push(under);
      s.pile.push(placed);
      ev.push({ type: "played", seat: me, cardIds: [placed.cardId], ability: false });
      break;
    }
    case "alarm":
      s.direction = s.direction === 1 ? -1 : 1;
      ev.push({ type: "direction", direction: s.direction });
      for (let seat = 0; seat < n(s); seat++)
        if (seat !== me) hits.push({ kind: "draw", target: seat, amount: 1 });
      break;
    case "magnet": {
      target = fewest(s, me);
      if (target === null || choice.card === undefined) throw new CommandError("invalid_choice");
      s.players[target]?.hand.push(take(s, me, choice.card));
      ev.push({ type: "card_given", from: me, to: target });
      break;
    }
    case "peek": {
      target = opponent(s, me, choice.target);
      const theirs = shuffle(s.players[target]?.hand ?? [], rng).slice(0, 2);
      ev.push({
        type: "peek",
        seat: me,
        target,
        cards: theirs.map((x) => x.cardId),
        private: true,
      });
      break;
    }
    case "ruler":
      s.ruler = { seat: nextSeat(s, me), value: 5 };
      target = s.ruler.seat;
      break;
    case "tape": {
      const pair = choice.pair;
      if (!pair || pair[0] === pair[1]) throw new CommandError("invalid_choice");
      const a = hand.find((x) => x.id === pair[0]);
      const b = hand.find((x) => x.id === pair[1]);
      if (!a || !b || points(a) !== points(b)) throw new CommandError("invalid_choice");
      s.pile.push(take(s, me, a.id), take(s, me, b.id));
      ev.push({ type: "played", seat: me, cardIds: [a.cardId, b.cardId], ability: false });
      break;
    }
    case "trash": {
      if (choice.card === undefined) throw new CommandError("invalid_choice");
      const gone = take(s, me, choice.card);
      s.removed.push(gone);
      ev.push({ type: "removed", seat: me, cardId: gone.cardId });
      draw(s, me, 1, rng, ev);
      break;
    }
    case "flashlight":
      target = opponent(s, me, choice.target);
      ev.push({ type: "reveal_all", hands: s.players.map((p) => p.hand.map((x) => x.cardId)) });
      hits.push({ kind: "draw", target, amount: 1 });
      break;
    case "skip":
      target = nextSeat(s, me);
      hits.push({ kind: "skip", target, amount: 1 });
      break;
    case "fan":
      target = fewest(s, me);
      if (target !== null) hits.push({ kind: "draw", target, amount: 1 });
      break;
    case "hourglass": {
      const under = s.pile[s.pile.length - 2];
      const again = under ? getDiscardCard(under.cardId).ability : null;
      // Repeats the card under it; never chains Hourglass or Umbrella (loop guard).
      if (again && again !== "hourglass" && again !== "umbrella" && depth === 0)
        resolveAbility(s, me, again, choice, rng, ev, hits, depth + 1);
      break;
    }
    case "umbrella":
      return;
  }
  ev.push({ type: "ability", seat: me, ability, target });
}

/** Applies a hit now, or queues it when the target holds an Umbrella (Core Rules §6). */
function applyHits(s: GameState, hits: PendingHit[], rng: RandomSource, ev: GameEvent[]): void {
  for (const hit of hits) {
    const holds = s.players[hit.target]?.hand.some(
      (x) => getDiscardCard(x.cardId).ability === "umbrella",
    );
    if (holds) s.reactions.push(hit);
    else applyHit(s, hit, rng, ev);
  }
}

function applyHit(s: GameState, hit: PendingHit, rng: RandomSource, ev: GameEvent[]): void {
  if (hit.kind === "draw") draw(s, hit.target, hit.amount, rng, ev);
  else s.skip = hit.target;
}

function checkWin(s: GameState, seat: Seat, ev: GameEvent[]): boolean {
  if ((s.players[seat]?.hand.length ?? 1) > 0) return false;
  s.status = "finished";
  s.winner = seat;
  s.reactions = [];
  ev.push({ type: "game_over", winner: seat });
  return true;
}

/** Next turn: skips (Key), pile reset when everyone else passed (DC1). */
function advance(s: GameState, ev: GameEvent[]): void {
  let seat = nextSeat(s, s.current);
  if (s.skip === seat) {
    s.skip = null;
    ev.push({ type: "skipped", seat });
    if (s.ruler?.seat === seat) s.ruler = null;
    if (s.glue === seat) s.glue = null;
    s.passStreak++;
    seat = nextSeat(s, seat);
  }
  if (s.lastPlayed !== null && s.passStreak >= n(s) - 1) {
    seat = s.lastPlayed;
    s.open = true;
    s.passStreak = 0;
    s.ruler = null;
    ev.push({ type: "pile_reset", seat });
  }
  s.current = seat;
  s.turnNumber++;
}

// ---------------------------------------------------------------- commands

export function applyCommand(state: GameState, command: Command, rng: RandomSource): Transition {
  if (state.status === "finished") throw new CommandError("game_over");
  const s = clone(state);
  const ev: GameEvent[] = [];
  const me = seatOf(s, command.playerId);

  if (command.type === "react") {
    const hit = s.reactions[0];
    if (hit?.target !== me) throw new CommandError("no_reaction");
    s.reactions.shift();
    const umbrella = s.players[me]?.hand.find(
      (x) => getDiscardCard(x.cardId).ability === "umbrella",
    );
    if (command.useUmbrella && umbrella) {
      s.pile.push(take(s, me, umbrella.id));
      s.open = false;
      ev.push({ type: "umbrella", seat: me, blocked: hit.kind });
      if (checkWin(s, me, ev)) return { state: s, events: ev };
    } else applyHit(s, hit, rng, ev);
    if (s.reactions.length === 0) advance(s, ev);
    return { state: s, events: ev };
  }

  if (s.reactions.length > 0) throw new CommandError("awaiting_reaction");
  if (me !== s.current) throw new CommandError("not_your_turn");

  if (command.type === "draw") {
    const forced = s.ruler?.seat === me;
    if (s.ruler?.seat === me) s.ruler = null;
    if (s.glue === me) s.glue = null;
    draw(s, me, 1, rng, ev);
    ev.push({ type: "passed", seat: me, forced });
    s.passStreak++;
    advance(s, ev);
    return { state: s, events: ev };
  }

  const card = s.players[me]?.hand.find((x) => x.id === command.card);
  if (!card) throw new CommandError("card_not_in_hand");
  if (!canPlay(s, me, card)) throw new CommandError("cannot_play");
  const def = getDiscardCard(card.cardId);
  s.pile.push(take(s, me, card.id));
  s.open = false;
  if (s.ruler?.seat === me) s.ruler = null;
  if (s.glue === me) s.glue = null;
  s.lastPlayed = me;
  s.passStreak = 0;
  ev.push({ type: "played", seat: me, cardIds: [card.cardId], ability: command.useAbility });
  const hits: PendingHit[] = [];
  if (command.useAbility) resolveAbility(s, me, def.ability, command.choice ?? {}, rng, ev, hits);
  if (checkWin(s, me, ev)) return { state: s, events: ev };
  applyHits(s, hits, rng, ev);
  if (s.reactions.length === 0) advance(s, ev);
  return { state: s, events: ev };
}

/** Who must act now: a pending Umbrella decision first, otherwise the current player. */
export function actingSeat(s: GameState): Seat | null {
  if (s.status === "finished") return null;
  return s.reactions[0]?.target ?? s.current;
}
