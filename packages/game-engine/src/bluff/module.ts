import type { RandomSource } from "../rng/seeded-random.ts";
import { GameRuleError, InvalidCommandError, type GameModule, type Seat } from "../sdk/module.ts";
import { placements, scoreRound, type Option, type SeatInput, type SeatScore } from "./scoring.ts";

/**
 * BLUFF (flagship v2 party game), ruleset "2": 5 rounds of read → claim → lock → reveal → score.
 * Answers, predictions and wagers stay server-side until Reveal (view only shows "locked").
 * Content comes from the server in `setup` (the engine never reads the database).
 */
export const BLUFF_RULESET_VERSION = "2";
export const BLUFF_ROUNDS = 5;
const PHASE_MS = { read: 6_000, claim: 15_000, lock: 20_000, reveal: 8_000, score: 5_000 } as const;
/** Preset taunts (no free text in MVP); the UI shows the text, the engine stores the index. */
export const BLUFF_TAUNTS = [
  "ทายถูกแน่นอน 😎",
  "ห้องนี้อ่านง่ายมาก",
  "อย่าเชื่อใครทั้งนั้น",
  "ฉันพูดจริงนะ 🙏",
  "รอดูหน้าทุกคนตอนเฉลย",
] as const;

export interface BluffItem {
  readonly id: string;
  readonly version: number;
  readonly prompt: string;
  readonly options: readonly [string, string, string, string];
}
export interface BluffSetup {
  readonly items: readonly BluffItem[];
  /** Host setting "slow": every phase timer × 1.5. */
  readonly slow: boolean;
}

type Phase = "read" | "claim" | "lock" | "reveal" | "score" | "finished";
type Act =
  | { readonly kind: "claim"; readonly option: Option }
  | { readonly kind: "taunt"; readonly taunt: number }
  | { readonly kind: "pass" };
interface Lock {
  readonly answer: Option | null;
  readonly prediction: Option | null;
  readonly wager: 0 | 1 | 2;
}
export interface RoundRecord {
  readonly round: number;
  readonly itemId: string;
  readonly itemVersion: number;
  readonly locks: readonly Lock[];
  readonly claims: readonly (Option | null)[];
  readonly points: readonly SeatScore[];
}
export interface BluffState {
  readonly players: readonly string[];
  readonly items: readonly BluffItem[];
  readonly slow: boolean;
  readonly round: number;
  readonly phase: Phase;
  readonly acts: readonly (Act | null)[];
  readonly locks: readonly (Lock | null)[];
  readonly scores: readonly number[];
  readonly hits: readonly number[];
  readonly reads: readonly number[];
  readonly history: readonly RoundRecord[];
}

export type BluffCommand =
  | { readonly type: "claim"; readonly option: Option }
  | { readonly type: "taunt"; readonly taunt: number }
  | { readonly type: "pass" }
  | {
      readonly type: "lock";
      readonly answer: Option;
      readonly prediction: Option;
      readonly wager: 0 | 1 | 2;
    }
  /** Server-only timeout default (never produced by parseCommand). */
  | { readonly type: "lock_default" };

export type BluffEvent =
  | { readonly type: "phase"; readonly round: number; readonly phase: Phase }
  | { readonly type: "claim"; readonly seat: Seat; readonly option: Option }
  | { readonly type: "taunt"; readonly seat: Seat; readonly taunt: number }
  | { readonly type: "pass"; readonly seat: Seat }
  | { readonly type: "locked"; readonly seat: Seat }
  | { readonly type: "round_scored"; readonly round: number; readonly record: RoundRecord }
  | { readonly type: "timeout"; readonly seat: Seat };

export interface BluffView {
  readonly gameId: "bluff";
  readonly seat: Seat | null;
  readonly players: readonly string[];
  readonly round: number;
  readonly rounds: number;
  readonly phase: Phase;
  readonly finalRound: boolean;
  readonly item: { readonly prompt: string; readonly options: readonly string[] } | null;
  /** Public live feed: claims / taunts / passes made this round. */
  readonly acts: readonly (Act | null)[];
  readonly locked: readonly boolean[];
  /** The viewer's own lock (never other seats' before Reveal). */
  readonly myLock: Lock | null;
  readonly scores: readonly number[];
  readonly hits: readonly number[];
  /** Last scored round, shown from Reveal on (answers, predictions, wagers, points). */
  readonly reveal: RoundRecord | null;
  readonly placements: readonly number[] | null;
}

const isOption = (v: unknown): v is Option => v === 0 || v === 1 || v === 2 || v === 3;
const isWager = (v: unknown): v is 0 | 1 | 2 => v === 0 || v === 1 || v === 2;
const text = (v: unknown, max: number) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;

export function parseBluffSetup(raw: unknown, players: number): BluffSetup {
  if (typeof raw !== "object" || raw === null) throw new InvalidCommandError("setup required");
  const r = raw as Record<string, unknown>;
  const items = r["items"];
  if (!Array.isArray(items) || items.length !== BLUFF_ROUNDS)
    throw new InvalidCommandError(`setup needs ${String(BLUFF_ROUNDS)} items`);
  const parsed = items.map((it: unknown): BluffItem => {
    const o = (typeof it === "object" && it !== null ? it : {}) as Record<string, unknown>;
    const opts = o["options"];
    if (
      !text(o["id"], 80) ||
      !Number.isInteger(o["version"]) ||
      !text(o["prompt"], 200) ||
      !Array.isArray(opts) ||
      opts.length !== 4 ||
      !opts.every((x) => text(x, 60)) ||
      new Set(opts).size !== 4
    )
      throw new InvalidCommandError("setup item invalid");
    const [a, b, c, d] = opts as string[];
    return {
      id: o["id"] as string,
      version: o["version"] as number,
      prompt: o["prompt"] as string,
      options: [a ?? "", b ?? "", c ?? "", d ?? ""],
    };
  });
  if (new Set(parsed.map((i) => i.id)).size !== parsed.length)
    throw new InvalidCommandError("setup items repeat");
  if (players < 2 || players > 8) throw new InvalidCommandError("players 2-8");
  return { items: parsed, slow: r["slow"] === true };
}

export function parseBluffCommand(raw: unknown): BluffCommand {
  if (typeof raw !== "object" || raw === null) throw new InvalidCommandError("command required");
  const c = raw as Record<string, unknown>;
  switch (c["type"]) {
    case "claim":
      if (!isOption(c["option"])) throw new InvalidCommandError("option invalid");
      return { type: "claim", option: c["option"] };
    case "taunt": {
      const t = c["taunt"];
      if (typeof t !== "number" || !Number.isInteger(t) || t < 0 || t >= BLUFF_TAUNTS.length)
        throw new InvalidCommandError("taunt invalid");
      return { type: "taunt", taunt: t };
    }
    case "pass":
      return { type: "pass" };
    case "lock":
      if (!isOption(c["answer"]) || !isOption(c["prediction"]) || !isWager(c["wager"]))
        throw new InvalidCommandError("lock invalid");
      return { type: "lock", answer: c["answer"], prediction: c["prediction"], wager: c["wager"] };
    default:
      throw new InvalidCommandError("unknown command type");
  }
}

const empty = <T>(n: number): (T | null)[] => Array.from({ length: n }, () => null);

function enter(s: BluffState, phase: Phase): { state: BluffState; events: BluffEvent[] } {
  return { state: { ...s, phase }, events: [{ type: "phase", round: s.round, phase }] };
}

/** Lock phase ended (all locked or deadline): score the round and show the reveal. */
function scoreAndReveal(s: BluffState): { state: BluffState; events: BluffEvent[] } {
  const item = s.items[s.round - 1];
  const locks = s.locks.map((l) => l ?? { answer: null, prediction: null, wager: 0 as const });
  const claims = s.acts.map((a) => (a?.kind === "claim" ? a.option : null));
  const inputs: SeatInput[] = locks.map((l, i) => ({ ...l, claim: claims[i] ?? null }));
  const points = scoreRound(inputs, s.round === BLUFF_ROUNDS ? 2 : 1);
  const record: RoundRecord = {
    round: s.round,
    itemId: item?.id ?? "",
    itemVersion: item?.version ?? 0,
    locks,
    claims,
    points,
  };
  const next: BluffState = {
    ...s,
    phase: "reveal",
    locks,
    scores: s.scores.map((x, i) => x + (points[i]?.total ?? 0)),
    hits: s.hits.map((x, i) => x + (points[i]?.hit === true ? 1 : 0)),
    reads: s.reads.map((x, i) => x + (points[i]?.bluff ?? 0) + (points[i]?.honest ?? 0)),
    history: [...s.history, record],
  };
  return {
    state: next,
    events: [
      { type: "round_scored", round: s.round, record },
      { type: "phase", round: s.round, phase: "reveal" },
    ],
  };
}

function pending(s: BluffState): Seat[] {
  const open = s.phase === "claim" ? s.acts : s.phase === "lock" ? s.locks : null;
  return open === null ? [] : open.flatMap((x, i) => (x === null ? [i] : []));
}

/**
 * Medium bot (owner 2026-11-25): uses only public data (claims) — never other seats' locks.
 * Claim phase: 50 % claims (60 % of those truthful to the answer it will give), 20 % taunt, 30 % pass.
 * Lock: keeps its claim when it was truthful; predicts the most-claimed option among others
 * (random if nobody claimed) and wagers 1 only when two or more others agree, else 0.
 */
export function bluffBot(s: BluffState, seat: Seat, rng: RandomSource): BluffCommand {
  const pick = (): Option => rng.nextInt(4) as Option;
  if (s.phase === "claim") {
    const r = rng.nextInt(10);
    if (r < 5) return { type: "claim", option: pick() };
    if (r < 7) return { type: "taunt", taunt: rng.nextInt(BLUFF_TAUNTS.length) };
    return { type: "pass" };
  }
  const own = s.acts[seat];
  const answer: Option = own?.kind === "claim" && rng.nextInt(10) < 6 ? own.option : pick();
  const counts = [0, 0, 0, 0];
  s.acts.forEach((a, i) => {
    if (i !== seat && a?.kind === "claim") counts[a.option] = (counts[a.option] ?? 0) + 1;
  });
  const max = Math.max(...counts);
  const best = ([0, 1, 2, 3] as const).filter((k) => counts[k] === max);
  const prediction: Option = max === 0 ? pick() : (best[rng.nextInt(best.length)] ?? 0);
  return { type: "lock", answer, prediction, wager: max >= 2 ? 1 : 0 };
}

export const bluff: GameModule<BluffState, BluffCommand, BluffView, BluffEvent> = {
  id: "bluff",
  rulesetVersion: BLUFF_RULESET_VERSION,
  minPlayers: 2,
  maxPlayers: 8,
  afkTimeouts: 2,
  start(playerIds, _rng: RandomSource, setup?: unknown) {
    const n = playerIds.length;
    const { items, slow } = parseBluffSetup(setup, n);
    const state: BluffState = {
      players: [...playerIds],
      items,
      slow,
      round: 1,
      phase: "read",
      acts: empty(n),
      locks: empty(n),
      scores: playerIds.map(() => 0),
      hits: playerIds.map(() => 0),
      reads: playerIds.map(() => 0),
      history: [],
    };
    return { state, events: [{ type: "phase", round: 1, phase: "read" }] };
  },
  actingSeat: () => null,
  pendingSeats: pending,
  seatCount: (s) => s.players.length,
  timerKey: (s) => `${String(s.round)}:${s.phase}`,
  timeoutMs: (s) => (s.phase === "finished" ? 0 : PHASE_MS[s.phase] * (s.slow ? 1.5 : 1)),
  allowsStaleVersion: () => true,
  parseCommand: parseBluffCommand,
  apply(s, seat, command) {
    if (seat < 0 || seat >= s.players.length) throw new GameRuleError("bad_seat");
    if (command.type === "lock" || command.type === "lock_default") {
      if (s.phase !== "lock") throw new GameRuleError("not_lock_phase");
      if (s.locks[seat] !== null) throw new GameRuleError("already_locked");
      const lock: Lock =
        command.type === "lock"
          ? { answer: command.answer, prediction: command.prediction, wager: command.wager }
          : { answer: null, prediction: null, wager: 0 };
      const locked: BluffState = { ...s, locks: s.locks.map((l, i) => (i === seat ? lock : l)) };
      const events: BluffEvent[] = [{ type: "locked", seat }];
      if (pending(locked).length > 0) return { state: locked, events };
      const r = scoreAndReveal(locked);
      return { state: r.state, events: [...events, ...r.events] };
    }
    if (s.phase !== "claim") throw new GameRuleError("not_claim_phase");
    if (s.acts[seat] !== null) throw new GameRuleError("already_claimed");
    const act: Act =
      command.type === "claim"
        ? { kind: "claim", option: command.option }
        : command.type === "taunt"
          ? { kind: "taunt", taunt: command.taunt }
          : { kind: "pass" };
    const event: BluffEvent =
      act.kind === "claim"
        ? { type: "claim", seat, option: act.option }
        : act.kind === "taunt"
          ? { type: "taunt", seat, taunt: act.taunt }
          : { type: "pass", seat };
    const claimed: BluffState = { ...s, acts: s.acts.map((a, i) => (i === seat ? act : a)) };
    if (pending(claimed).length > 0) return { state: claimed, events: [event] };
    const r = enter(claimed, "lock");
    return { state: r.state, events: [event, ...r.events] };
  },
  tick(s) {
    switch (s.phase) {
      case "read":
        return enter(s, "claim");
      case "reveal":
        return enter(s, "score");
      case "score": {
        if (s.round >= BLUFF_ROUNDS) return enter(s, "finished");
        const n = s.players.length;
        const next: BluffState = { ...s, round: s.round + 1, acts: empty(n), locks: empty(n) };
        return enter(next, "read");
      }
      default:
        return { state: s, events: [] };
    }
  },
  // Timeout = no claim / no answer (not counted, no Crowd), no prediction, wager 0 (Bluff §4).
  bot: bluffBot,
  timeoutCommands: (s) => (s.phase === "claim" ? [{ type: "pass" }] : [{ type: "lock_default" }]),
  view(s, seat) {
    const own = seat === null ? null : (s.locks[seat] ?? null);
    const showReveal = s.phase === "reveal" || s.phase === "score" || s.phase === "finished";
    const item = s.items[s.round - 1];
    return {
      gameId: "bluff",
      seat,
      players: s.players,
      round: s.round,
      rounds: BLUFF_ROUNDS,
      phase: s.phase,
      finalRound: s.round === BLUFF_ROUNDS,
      item: item ? { prompt: item.prompt, options: item.options } : null,
      acts: s.acts,
      locked: s.locks.map((l) => l !== null),
      myLock: own,
      scores: s.scores,
      hits: s.hits,
      reveal: showReveal ? (s.history[s.history.length - 1] ?? null) : null,
      placements: s.phase === "finished" ? placements(s.scores, s.hits, s.reads) : null,
    };
  },
  // Locks stay secret until the round is scored; everything else is public.
  publicEvent: (e) => e,
  privateEvents: () => [],
  timeoutEvent: (seat) => ({ type: "timeout", seat }),
  isFinished: (s) => s.phase === "finished",
  result(s) {
    if (s.phase !== "finished") return null;
    const p = placements(s.scores, s.hits, s.reads);
    return { winners: p.flatMap((x, i) => (x === 1 ? [i] : [])), scores: s.scores };
  },
  handCounts: (s) => s.players.map(() => 0),
  round: (s) => s.round,
  phase: (s) => s.phase,
};
