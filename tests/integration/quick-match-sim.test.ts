/**
 * Task 12.11 — Quick Match simulation (analysis only; production rules are unchanged).
 * Uses the real engine (`discard.startGame` / `applyCommand` / `canPlay`) and the real card data.
 * Variants are applied by this harness only:
 *  - starting hand size: extra dealt cards go back into the draw pile, which is reshuffled;
 *  - Draw Then Play: if the top of the draw pile is playable, the harness moves it into the hand
 *    and plays it with a normal `play` command (only that card); otherwise the normal `draw`
 *    command draws that same card and passes — so the drawn card is identical in both branches.
 * Human time is a MODEL (see `thinkSeconds`), not measured play.
 *
 * Quick smoke run in CI; full report (JSON):
 *   `AUMMON_SIM=2000 AUMMON_SIM_OUT=/tmp/sim.json pnpm vitest run tests/integration/quick-match-sim.test.ts --testTimeout=1200000`
 */
import { createSeededRandom, discard, type RandomSource } from "@aummon/game-engine";
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Profile = "careful" | "casual" | "impulsive" | "slow";
const PROFILES: readonly Profile[] = ["careful", "casual", "impulsive", "slow"];
/** Median decision time in seconds per profile (assumption, see the simulation report). */
const MEDIAN_THINK: Record<Profile, number> = { careful: 7, casual: 5.5, impulsive: 3.5, slow: 11 };

export interface Config {
  readonly name: string;
  readonly hand: (players: number) => number;
  readonly drawThenPlay: boolean;
  readonly turnTimer: number;
  readonly reactionTimer: number;
  /** Abilities that are never used (ablation study). */
  readonly noAbility?: discard.AbilityId;
  /** PROPOSAL emulation: Alarm Clock = reverse + only the new next player draws 1. */
  readonly alarmNextOnly?: boolean;
}

const current = (n: number) => (n <= 4 ? 7 : 5);
const quick = (n: number) => (n <= 4 ? 5 : 4);
const small = (n: number) => (n <= 4 ? 4 : 3);
export const CONFIGS: readonly Config[] = [
  { name: "A current", hand: current, drawThenPlay: false, turnTimer: 45, reactionTimer: 8 },
  { name: "B hand 5/4", hand: quick, drawThenPlay: false, turnTimer: 45, reactionTimer: 8 },
  { name: "C 5/4 + DTP", hand: quick, drawThenPlay: true, turnTimer: 45, reactionTimer: 8 },
  { name: "D 5/4 + DTP + 20s", hand: quick, drawThenPlay: true, turnTimer: 20, reactionTimer: 8 },
  {
    name: "E 5/4 + DTP + 20s + Alarm next-only",
    hand: quick,
    drawThenPlay: true,
    turnTimer: 20,
    reactionTimer: 5,
    alarmNextOnly: true,
  },
  {
    name: "X1 5/4 + 20s (no DTP)",
    hand: quick,
    drawThenPlay: false,
    turnTimer: 20,
    reactionTimer: 5,
  },
  { name: "X2 4/3 + DTP + 20s", hand: small, drawThenPlay: true, turnTimer: 20, reactionTimer: 5 },
  {
    name: "X3 4/3 + DTP + 20s + Alarm next-only",
    hand: small,
    drawThenPlay: true,
    turnTimer: 20,
    reactionTimer: 5,
    alarmNextOnly: true,
  },
];

interface GameResult {
  finished: boolean;
  turns: number;
  seconds: number;
  winner: number | null;
  first: number;
  profiles: Profile[];
  abilities: number;
  cardsDrawn: number;
  resets: number;
  umbrellas: number;
  timeouts: number;
  dtpPlays: number;
  maxWaitSeconds: number;
}

const ANIMATION_S = 1.0; // server round trip + card animation per action
const REACTION_THINK_S = 2.5;

function lognormal(rng: RandomSource, median: number): number {
  // Box–Muller with sigma 0.5 → roughly 0.4×–2.7× the median at the tails.
  const u = Math.max(unit(rng), 1e-9);
  const v = unit(rng);
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return median * Math.exp(0.5 * z);
}

const unit = (rng: RandomSource) => rng.nextInt(1_000_000) / 1_000_000;
const pts = (c: discard.CardInstance) => discard.getDiscardCard(c.cardId).points;

function randomChoice(
  s: discard.GameState,
  me: number,
  card: discard.CardInstance,
  rng: RandomSource,
): discard.AbilityChoice {
  const rest = (s.players[me]?.hand ?? []).filter((c) => c.id !== card.id);
  const others = s.players.map((_, i) => i).filter((i) => i !== me);
  const pairs = rest.flatMap((x) =>
    rest.filter((y) => x.id < y.id && pts(x) === pts(y)).map((y) => [x.id, y.id]),
  );
  const [x, y] = pairs[rng.nextInt(Math.max(pairs.length, 1))] ?? [];
  return {
    target: others[rng.nextInt(others.length)] ?? 0,
    ...(rest.length > 0 && { card: rest[rng.nextInt(rest.length)]?.id ?? "" }),
    ...(x && y && { pair: [x, y] as const }),
  };
}

/** Tries `cmd` and falls back to playing without the ability when the choice is invalid. */
function safePlay(
  s: discard.GameState,
  cmd: discard.Command,
  rng: RandomSource,
  cfg?: Config,
): discard.Transition {
  if (cfg?.alarmNextOnly && cmd.type === "play" && cmd.useAbility) {
    const id = cmd.card;
    const card = s.players.flatMap((p) => p.hand).find((c) => c.id === id);
    if (card && discard.getDiscardCard(card.cardId).ability === "alarm") {
      // Emulated proposal: reverse, then the next player (new direction) draws 1.
      const me = discard.actingSeat(s) ?? 0;
      const t = discard.applyCommand(s, { ...cmd, useAbility: false, choice: {} }, rng);
      if (t.state.status === "finished") return t;
      const st = t.state;
      st.direction = st.direction === 1 ? -1 : 1;
      st.current = discard.nextSeat(st, me);
      const drawn = st.drawPile.shift();
      if (drawn) st.players[st.current]?.hand.push(drawn);
      return {
        state: st,
        events: [...t.events, { type: "drew", seat: st.current, count: drawn ? 1 : 0 }],
      };
    }
  }
  try {
    return discard.applyCommand(s, cmd, rng);
  } catch (e) {
    if (!(e instanceof discard.CommandError) || cmd.type !== "play") throw e;
    return discard.applyCommand(s, { ...cmd, useAbility: false, choice: {} }, rng);
  }
}

function decide(
  s: discard.GameState,
  me: number,
  profile: Profile,
  rng: RandomSource,
  cfg: Config,
): discard.Command {
  const playerId = s.players[me]?.playerId ?? "";
  const bot = discard.chooseBotCommand(s, me, rng);
  let cmd: discard.Command = bot;
  if (bot.type === "play" && (profile === "casual" || profile === "impulsive")) {
    const hand = s.players[me]?.hand ?? [];
    const playable = hand.filter((c) => discard.canPlay(s, me, c));
    const pick =
      profile === "impulsive"
        ? [...playable].sort((a, b) => pts(b) - pts(a))[0]
        : playable[rng.nextInt(playable.length)];
    if (pick) {
      const use = profile === "impulsive" || unit(rng) < 0.75;
      cmd = {
        type: "play",
        playerId,
        card: pick.id,
        useAbility: use,
        choice: use ? randomChoice(s, me, pick, rng) : {},
      };
    }
  }
  if (cmd.type === "play" && cfg.noAbility) {
    const id = cmd.card;
    const card = s.players[me]?.hand.find((c) => c.id === id);
    if (card && discard.getDiscardCard(card.cardId).ability === cfg.noAbility)
      cmd = { ...cmd, useAbility: false, choice: {} };
  }
  return cmd;
}

export function playGame(players: number, seed: number, cfg: Config): GameResult {
  const rng = createSeededRandom([seed, players * 7919, 17, 4242]);
  const ids = Array.from({ length: players }, (_, i) => `p${String(i)}`);
  let { state } = discard.startGame(ids, rng);
  // Starting hand variant: surplus back to the draw pile, then reshuffle.
  const size = cfg.hand(players);
  for (const p of state.players) state.drawPile.push(...p.hand.splice(size));
  for (let i = state.drawPile.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const a = state.drawPile[i];
    const b = state.drawPile[j];
    if (a && b) {
      state.drawPile[i] = b;
      state.drawPile[j] = a;
    }
  }
  const profiles = ids.map(() => PROFILES[rng.nextInt(PROFILES.length)] ?? "careful");
  const r: GameResult = {
    finished: false,
    turns: 0,
    seconds: 0,
    winner: null,
    first: state.firstSeat,
    profiles,
    abilities: 0,
    cardsDrawn: 0,
    resets: 0,
    umbrellas: 0,
    timeouts: 0,
    dtpPlays: 0,
    maxWaitSeconds: 0,
  };
  const lastTurnAt = ids.map(() => 0);
  for (let step = 0; step < 3000 && state.status === "active"; step++) {
    const me = discard.actingSeat(state);
    if (me === null) break;
    const profile = profiles[me] ?? "careful";
    const playerId = state.players[me]?.playerId ?? "";
    let t: discard.Transition;
    if (state.reactions[0]?.target === me) {
      const think = Math.min(REACTION_THINK_S * (profile === "slow" ? 1.6 : 1), cfg.reactionTimer);
      r.seconds += think + ANIMATION_S;
      const use = profile !== "casual" || unit(rng) < 0.8;
      t = discard.applyCommand(state, { type: "react", playerId, useUmbrella: use }, rng);
    } else {
      r.turns++;
      r.maxWaitSeconds = Math.max(r.maxWaitSeconds, r.seconds - (lastTurnAt[me] ?? 0));
      lastTurnAt[me] = r.seconds;
      let cmd = decide(state, me, profile, rng, cfg);
      const needsChoice = cmd.type === "play" && cmd.useAbility;
      let think = lognormal(rng, MEDIAN_THINK[profile]) * (needsChoice ? 1.3 : 0.8);
      if (think > cfg.turnTimer) {
        // Server timeout: draw 1 and pass (never plays the drawn card).
        think = cfg.turnTimer;
        cmd = { type: "draw", playerId };
        r.timeouts++;
        r.seconds += think + ANIMATION_S;
        t = discard.applyCommand(state, cmd, rng);
      } else if (cmd.type === "draw" && cfg.drawThenPlay) {
        const top = state.drawPile[0];
        const keep = top && discard.getDiscardCard(top.cardId).ability === "umbrella";
        if (top && discard.canPlay(state, me, top) && !(keep && profile === "careful")) {
          // Draw Then Play: only the drawn card may be played.
          const s = { ...state, drawPile: state.drawPile.slice(1) };
          s.players = state.players.map((p, i) =>
            i === me ? { ...p, hand: [...p.hand, top] } : p,
          );
          const use = profile !== "casual" || unit(rng) < 0.75;
          const play: discard.Command = {
            type: "play",
            playerId,
            card: top.id,
            useAbility: use,
            choice: use ? randomChoice(s, me, top, rng) : {},
          };
          r.cardsDrawn++;
          r.dtpPlays++;
          r.seconds += think + 2.5 + 2 * ANIMATION_S; // see the card, decide, play
          t = safePlay(s, play, rng, cfg);
        } else {
          r.seconds += think + ANIMATION_S;
          t = discard.applyCommand(state, cmd, rng);
        }
      } else {
        r.seconds += think + ANIMATION_S;
        t = safePlay(state, cmd, rng, cfg);
      }
    }
    for (const e of t.events) {
      if (e.type === "ability") r.abilities++;
      if (e.type === "drew") r.cardsDrawn += e.count;
      if (e.type === "pile_reset") r.resets++;
      if (e.type === "umbrella") r.umbrellas++;
    }
    state = t.state;
  }
  r.finished = state.status === "finished";
  r.winner = state.winner;
  return r;
}

// ---------------------------------------------------------------- report helpers

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0;
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
const f1 = (x: number) => x.toFixed(1);

export function summarize(cfg: Config, players: number, games: number) {
  const rs = Array.from({ length: games }, (_, g) => playGame(players, g + 1, cfg));
  const fin = rs.filter((r) => r.finished);
  const mins = fin.map((r) => r.seconds / 60);
  const wins: Record<Profile, [number, number]> = {
    careful: [0, 0],
    casual: [0, 0],
    impulsive: [0, 0],
    slow: [0, 0],
  };
  for (const r of fin)
    r.profiles.forEach((p, i) => {
      wins[p][1]++;
      if (r.winner === i) wins[p][0]++;
    });
  return {
    config: cfg.name,
    players,
    games,
    finishedPct: (fin.length / games) * 100,
    turnsMean: mean(fin.map((r) => r.turns)),
    turnsP50: pct(
      fin.map((r) => r.turns),
      50,
    ),
    turnsP90: pct(
      fin.map((r) => r.turns),
      90,
    ),
    turnsMax: Math.max(0, ...fin.map((r) => r.turns)),
    minP50: pct(mins, 50),
    minP90: pct(mins, 90),
    within10: (mins.filter((m) => m <= 10).length / Math.max(mins.length, 1)) * 100,
    in5to10: (mins.filter((m) => m >= 5 && m <= 10).length / Math.max(mins.length, 1)) * 100,
    waitP90: pct(
      fin.map((r) => r.maxWaitSeconds),
      90,
    ),
    firstWin: (fin.filter((r) => r.winner === r.first).length / Math.max(fin.length, 1)) * 100,
    abilities: mean(fin.map((r) => r.abilities)),
    drawn: mean(fin.map((r) => r.cardsDrawn)),
    resets: mean(fin.map((r) => r.resets)),
    umbrellas: mean(fin.map((r) => r.umbrellas)),
    timeouts: mean(fin.map((r) => r.timeouts)),
    dtp: mean(fin.map((r) => r.dtpPlays)),
    winByProfile: Object.fromEntries(
      PROFILES.map((p) => [p, f1((wins[p][0] / Math.max(wins[p][1], 1)) * 100)]),
    ),
  };
}

describe("quick match simulation (task 12.11)", () => {
  it("every configuration finishes games for 2–8 players (smoke)", () => {
    for (const cfg of CONFIGS)
      for (let n = 2; n <= 8; n++) {
        const s = summarize(cfg, n, 15);
        expect(s.finishedPct).toBeGreaterThanOrEqual(90); // step cap 3000 = stalled game (reported)
      }
  });

  const full = Number(process.env["AUMMON_SIM"] ?? 0);
  it.skipIf(!full)("full report", () => {
    const rows = [];
    for (const cfg of CONFIGS) for (let n = 2; n <= 8; n++) rows.push(summarize(cfg, n, full));
    const ablation = [];
    const base = CONFIGS[3];
    if (base)
      for (const n of [4, 8]) {
        const ref = summarize(base, n, full / 2);
        for (const card of discard.DISCARD_CARDS) {
          const s = summarize({ ...base, noAbility: card.ability }, n, full / 2);
          ablation.push({
            card: card.name,
            players: n,
            turnsDelta: ref.turnsMean - s.turnsMean,
            minDelta: ref.minP50 - s.minP50,
          });
        }
      }
    writeFileSync(
      process.env["AUMMON_SIM_OUT"] ?? "quick-match-sim.json",
      JSON.stringify({ rows, ablation }),
    );
  });
});
