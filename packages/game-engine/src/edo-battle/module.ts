import type { RandomSource } from "../rng/seeded-random.ts";
import { GameRuleError, InvalidCommandError, type GameModule } from "../sdk/module.ts";
import { RULESET_VERSION } from "../version.ts";
import * as discard from "../discard/index.ts";

/**
 * EDO Battle (Every Day Object) = Casual Discard Edition, ruleset "13".
 * Thin adapter over `../discard` — the rules engine itself is not modified.
 */
type Intent = discard.Command extends infer C
  ? C extends unknown
    ? Omit<C, "playerId">
    : never
  : never;
export type EdoCommand = Intent;

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

function idValue(v: unknown, label: string): string {
  if (typeof v !== "string" || !ID_RE.test(v)) throw new InvalidCommandError(`${label} invalid`);
  return v;
}

function parseChoice(raw: unknown): discard.AbilityChoice {
  if (raw === undefined) return {};
  if (typeof raw !== "object" || raw === null) throw new InvalidCommandError("choice invalid");
  const c = raw as Record<string, unknown>;
  const out: { target?: number; card?: string; pair?: [string, string] } = {};
  if (c["target"] !== undefined) {
    const t = c["target"];
    if (typeof t !== "number" || !Number.isInteger(t) || t < 0 || t > 7)
      throw new InvalidCommandError("target invalid");
    out.target = t;
  }
  if (c["card"] !== undefined) out.card = idValue(c["card"], "card");
  if (c["pair"] !== undefined) {
    const p: unknown = c["pair"];
    if (!Array.isArray(p) || p.length !== 2) throw new InvalidCommandError("pair invalid");
    out.pair = [idValue(p[0], "pair"), idValue(p[1], "pair")];
  }
  return out;
}

export function parseEdoCommand(raw: unknown): EdoCommand {
  if (typeof raw !== "object" || raw === null) throw new InvalidCommandError("command required");
  const c = raw as Record<string, unknown>;
  switch (c["type"]) {
    case "play":
      return {
        type: "play",
        card: idValue(c["card"], "card"),
        useAbility: c["useAbility"] === true,
        choice: parseChoice(c["choice"]),
      };
    case "draw":
      return { type: "draw" };
    case "keep":
      return { type: "keep" };
    case "react":
      return { type: "react", useUmbrella: c["useUmbrella"] === true };
    default:
      throw new InvalidCommandError("unknown command type");
  }
}

const R = discard.DISCARD_RULES;

export const edoBattle: GameModule<
  discard.GameState,
  EdoCommand,
  discard.SeatView,
  discard.GameEvent
> = {
  id: "edo_battle",
  rulesetVersion: RULESET_VERSION,
  minPlayers: R.minPlayers,
  maxPlayers: R.maxPlayers,
  afkTimeouts: R.afkTimeouts,
  start: (playerIds, rng) => discard.startGame(playerIds, rng),
  actingSeat: (s) => discard.actingSeat(s),
  timerKey: (s) => `${String(s.turnNumber)}:${String(s.reactions.length)}`,
  timeoutMs: (s) => (s.reactions.length > 0 ? R.reactionTimeoutMs : R.turnTimeoutMs),
  minDecision: (s) => (s.drawn ? { seat: s.drawn.seat, ms: R.drawnDecisionMinMs } : null),
  // Umbrella answers may arrive while the version moves (other reactions); others must be fresh.
  allowsStaleVersion: (c) => c.type === "react",
  parseCommand: parseEdoCommand,
  apply(s, seat, command, rng: RandomSource) {
    const playerId = s.players[seat]?.playerId ?? "";
    try {
      return discard.applyCommand(s, { ...command, playerId }, rng);
    } catch (e) {
      if (e instanceof discard.CommandError) throw new GameRuleError(e.code);
      throw e;
    }
  },
  // Timeout = draw & pass (Draw Then Play: the drawn card is kept), or decline Umbrella.
  timeoutCommands: (s, seat) => {
    if (s.reactions.length > 0) return [{ type: "react", useUmbrella: false }];
    if (s.drawn?.seat === seat) return [{ type: "keep" }];
    return [{ type: "draw" }];
  },
  afterTimeout: (s, seat) => (s.drawn?.seat === seat ? { type: "keep" } : null),
  bot: (s, seat, rng) => discard.chooseBotCommand(s, seat, rng),
  view: (s, seat) => discard.getView(s, seat),
  // Private peeks are stored without the cards; the peeking seat gets them in its response only.
  publicEvent: (e) => (e.type === "peek" ? { type: "peek", seat: e.seat, target: e.target } : e),
  privateEvents: (events, seat) =>
    events.flatMap((e) =>
      e.type === "peek" && e.seat === seat ? [{ target: e.target, cards: e.cards }] : [],
    ),
  timeoutEvent: (seat) => ({ type: "timeout", seat }),
  isFinished: (s) => s.status === "finished",
  result: (s) =>
    s.status === "finished" ? { winners: s.winner === null ? [] : [s.winner] } : null,
  handCounts: (s) => s.players.map((p) => p.hand.length),
  round: (s) => s.turnNumber,
  phase: (s) =>
    s.status === "finished" ? "finished" : s.reactions.length > 0 ? "reaction" : "play",
};
