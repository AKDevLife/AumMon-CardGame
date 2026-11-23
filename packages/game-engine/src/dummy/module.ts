import { InvalidCommandError, type GameModule } from "../sdk/module.ts";
import { chooseDummyBotCommand, dummyTimeoutDiscard } from "./bot.ts";
import {
  actingSeat,
  applyCommand,
  DUMMY_RULES,
  startGame,
  type Card,
  type DummyCommand,
  type DummyEvent,
  type DummyState,
} from "./engine.ts";
import { getDummyView, type DummyView } from "./view.ts";

export const DUMMY_RULESET_VERSION = "4";
const CARD_RE = /^[A2-9TJQK][cdhs]$/;

function card(v: unknown): Card {
  if (typeof v !== "string" || !CARD_RE.test(v)) throw new InvalidCommandError("card invalid");
  return v;
}
function cards(v: unknown): Card[] {
  if (!Array.isArray(v) || v.length < 1 || v.length > 13)
    throw new InvalidCommandError("cards invalid");
  return v.map(card);
}
function index(v: unknown, max: number): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > max)
    throw new InvalidCommandError("index invalid");
  return v;
}

export function parseDummyCommand(raw: unknown): DummyCommand {
  if (typeof raw !== "object" || raw === null) throw new InvalidCommandError("command required");
  const c = raw as Record<string, unknown>;
  switch (c["type"]) {
    case "draw":
      return { type: "draw" };
    case "pick":
      return {
        type: "pick",
        index: index(c["index"], 60),
        ...(c["meld"] !== undefined && { meld: cards(c["meld"]) }),
        ...(c["layoff"] !== undefined && { layoff: index(c["layoff"], 60) }),
      };
    case "meld":
      return { type: "meld", cards: cards(c["cards"]) };
    case "layoff":
      return { type: "layoff", meld: index(c["meld"], 60), cards: cards(c["cards"]) };
    case "discard":
      return { type: "discard", card: card(c["card"]) };
    default:
      throw new InvalidCommandError("unknown command type");
  }
}

export const dummy: GameModule<DummyState, DummyCommand, DummyView, DummyEvent> = {
  id: "dummy",
  rulesetVersion: DUMMY_RULESET_VERSION,
  minPlayers: DUMMY_RULES.minPlayers,
  maxPlayers: DUMMY_RULES.maxPlayers,
  afkTimeouts: DUMMY_RULES.afkTimeouts,
  start: (ids, rng) => startGame(ids, rng),
  actingSeat,
  // One timer for the whole turn (draw + play).
  timerKey: (s) => String(s.turnNumber),
  timeoutMs: () => DUMMY_RULES.turnTimeoutMs,
  parseCommand: parseDummyCommand,
  apply: (s, seat, c) => applyCommand(s, seat, c),
  // Timeout: draw (if not yet), then discard the least useful card.
  timeoutCommands: (s, seat) => [
    s.phase === "draw" ? { type: "draw" } : dummyTimeoutDiscard(s, seat),
  ],
  afterTimeout: (s, seat) =>
    s.status === "active" && s.current === seat && s.phase === "play"
      ? dummyTimeoutDiscard(s, seat)
      : null,
  bot: (s, seat) => chooseDummyBotCommand(s, seat),
  view: (s, seat) => getDummyView(s, seat),
  // Every dummy event is public: draws carry no card; picks, melds and discards are face-up.
  publicEvent: (e) => e,
  privateEvents: () => [],
  timeoutEvent: (seat) => ({ type: "timeout", seat }),
  isFinished: (s) => s.status === "finished",
  result: (s) => (s.status === "finished" ? { winners: s.winners, scores: s.scores ?? [] } : null),
  handCounts: (s) => s.players.map((p) => p.hand.length),
  round: (s) => s.turnNumber,
  phase: (s) => (s.status === "finished" ? "finished" : s.phase),
};
