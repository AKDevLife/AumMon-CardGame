import { InvalidCommandError, type GameModule } from "../sdk/module.ts";
import { choosePokerBotCommand } from "./bot.ts";
import {
  actingSeat,
  applyCommand,
  legalActions,
  POKER_RULES,
  startGame,
  type PokerCommand,
  type PokerEvent,
  type PokerState,
} from "./engine.ts";
import { getPokerView, type PokerView } from "./view.ts";

export const POKER_RULESET_VERSION = "1";

export function parsePokerCommand(raw: unknown): PokerCommand {
  if (typeof raw !== "object" || raw === null) throw new InvalidCommandError("command required");
  const c = raw as Record<string, unknown>;
  switch (c["type"]) {
    case "fold":
    case "check":
    case "call":
    case "all_in":
      return { type: c["type"] };
    case "raise": {
      const to = c["to"];
      if (typeof to !== "number" || !Number.isInteger(to) || to < 1 || to > 10_000_000)
        throw new InvalidCommandError("raise amount invalid");
      return { type: "raise", to };
    }
    default:
      throw new InvalidCommandError("unknown command type");
  }
}

export const poker: GameModule<PokerState, PokerCommand, PokerView, PokerEvent> = {
  id: "poker",
  rulesetVersion: POKER_RULESET_VERSION,
  minPlayers: POKER_RULES.minPlayers,
  maxPlayers: POKER_RULES.maxPlayers,
  afkTimeouts: POKER_RULES.afkTimeouts,
  start: (ids, rng) => startGame(ids, rng),
  actingSeat,
  timerKey: (s) => `${String(s.hand)}:${s.street}:${String(s.current)}:${String(s.currentBet)}`,
  timeoutMs: () => POKER_RULES.turnTimeoutMs,
  parseCommand: parsePokerCommand,
  apply: (s, seat, c, rng) => applyCommand(s, seat, c, rng),
  // Timeout: check when free, otherwise fold.
  timeoutCommands: (s, seat) => [
    legalActions(s, seat)?.canCheck ? { type: "check" } : { type: "fold" },
  ],
  bot: (s, seat, rng) => choosePokerBotCommand(s, seat, rng),
  view: (s, seat) => getPokerView(s, seat),
  // Every poker event is public: hole cards appear only in showdown events (public by rule).
  publicEvent: (e) => e,
  privateEvents: () => [],
  timeoutEvent: (seat) => ({ type: "timeout", seat }),
  isFinished: (s) => s.status === "finished",
  result: (s) =>
    s.status === "finished" ? { winners: s.winners, scores: s.players.map((x) => x.stack) } : null,
  handCounts: (s) => s.players.map((x) => (x.folded ? 0 : x.hole.length)),
  round: (s) => s.hand,
  phase: (s) => (s.status === "finished" ? "finished" : s.street),
};
