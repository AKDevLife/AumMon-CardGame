/**
 * Quick Match simulation on the real engine (ruleset "8": 5 / 4 cards, Draw Then Play, Alarm
 * next-only). The task 12.11 comparison with ruleset 7 (configs A–E, X1–X3) was run on the
 * ruleset 7 engine at commit 07ebd61 — see docs/games/object-battle/SPEC.md.
 * Harness-only variants (for tuning): starting hand size, Draw Then Play off (drawn card kept),
 * timers. Human time is a MODEL (`lognormal` medians per profile), not measured play.
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
  /** PROPOSAL emulation: card points override (restored after each game). */
  readonly points?: Readonly<Record<string, number>>;
  /** PROPOSAL B4B emulation: after Magnifier, play 1 more legal card (no ability). */
  readonly magnifierExtra?: boolean;
  /** PROPOSAL B6B emulation: Box = put your lowest card on the pile (no ability). */
  readonly boxShed?: boolean;
  /** With boxShed: only a card with at most this many points may be placed. */
  readonly boxShedMax?: number;
}

const quick = (n: number) => (n <= 4 ? 5 : 4);
const h75 = (n: number) => (n <= 4 ? 7 : 5);
export const CONFIGS: readonly Config[] = [
  { name: "R13 shipped", hand: h75, drawThenPlay: true, turnTimer: 60, reactionTimer: 5 },
  { name: "R13 without DTP", hand: h75, drawThenPlay: false, turnTimer: 60, reactionTimer: 5 },
  { name: "R13 5/4 cards", hand: quick, drawThenPlay: true, turnTimer: 60, reactionTimer: 5 },
  { name: "R13 20 s timer", hand: h75, drawThenPlay: true, turnTimer: 20, reactionTimer: 5 },
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
  cardsPlayed: number;
  forcedDraws: number;
  skips: number;
  /** Most forced draws / skips received by one player in the game. */
  maxHitsOnOne: number;
  abilityUse: Partial<Record<discard.AbilityId, number>>;
  /** Card ids in each seat's opening hand. */
  opening: string[][];
  /** Losers whose final hand is at least twice the starting size ("feels hopeless"). */
  hopeless: number;
  players: number;
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

/**
 * Proposal emulation: put one more card from `me`'s hand on the pile (no ability).
 * `any` = lowest card regardless of points (Box B6B); otherwise the lowest legal card (Magnifier B4B).
 */
function extraShed(t: discard.Transition, me: number, any: boolean, max = 99): discard.Transition {
  const st = t.state;
  if (st.status !== "active") return t;
  const hand = st.players[me]?.hand ?? [];
  const top = st.pile[st.pile.length - 1];
  const topPts = top ? pts(top) : 0;
  const pick = [...hand]
    .filter((c) =>
      any
        ? pts(c) <= max
        : pts(c) >= topPts || discard.getDiscardCard(c.cardId).ability === "eraser",
    )
    .sort((a, b) => pts(a) - pts(b))[0];
  if (!pick) return t;
  hand.splice(hand.indexOf(pick), 1);
  st.pile.push(pick);
  const events: discard.GameEvent[] = [
    ...t.events,
    { type: "played", seat: me, cardIds: [pick.cardId], ability: false },
  ];
  if (hand.length === 0) {
    st.status = "finished";
    st.winner = me;
    st.reactions = [];
  }
  return { state: st, events };
}

/** Tries `cmd` and falls back to playing without the ability when the choice is invalid. */
function safePlay(
  s: discard.GameState,
  cmd: discard.Command,
  rng: RandomSource,
): discard.Transition {
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
  const patched = Object.entries(cfg.points ?? {}).map(([id, pts]) => {
    const card = discard.getDiscardCard(id) as { points: number };
    const old = card.points;
    card.points = pts;
    return () => {
      card.points = old;
    };
  });
  try {
    return playOne(players, seed, cfg);
  } finally {
    for (const restore of patched) restore();
  }
}

function playOne(players: number, seed: number, cfg: Config): GameResult {
  const rng = createSeededRandom([seed, players * 7919, 17, 4242]);
  const ids = Array.from({ length: players }, (_, i) => `p${String(i)}`);
  let { state } = discard.startGame(ids, rng);
  // Starting hand variant: surplus back to the draw pile (or extra cards dealt), then reshuffle.
  const size = cfg.hand(players);
  for (const p of state.players) {
    state.drawPile.push(...p.hand.splice(size));
    while (p.hand.length < size && state.drawPile.length > 0) {
      const extra = state.drawPile.shift();
      if (extra) p.hand.push(extra);
    }
  }
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
    cardsPlayed: 0,
    forcedDraws: 0,
    skips: 0,
    maxHitsOnOne: 0,
    abilityUse: {},
    opening: state.players.map((p) => p.hand.map((c) => c.cardId)),
    hopeless: 0,
    players,
  };
  const hits = ids.map(() => 0);
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
    } else if (state.drawn?.seat === me) {
      // Draw Then Play decision on the drawn card (engine rule).
      const drawn = state.players[me]?.hand.find((c) => c.id === state.drawn?.id);
      const umbrella = drawn && discard.getDiscardCard(drawn.cardId).ability === "umbrella";
      if (cfg.drawThenPlay && drawn && !(umbrella && profile === "careful")) {
        const use = profile !== "casual" || unit(rng) < 0.75;
        r.dtpPlays++;
        r.seconds += 2.5 + ANIMATION_S;
        t = safePlay(
          state,
          {
            type: "play",
            playerId,
            card: drawn.id,
            useAbility: use,
            choice: use ? randomChoice(state, me, drawn, rng) : {},
          },
          rng,
        );
      } else t = discard.applyCommand(state, { type: "keep", playerId }, rng);
    } else {
      r.turns++;
      r.maxWaitSeconds = Math.max(r.maxWaitSeconds, r.seconds - (lastTurnAt[me] ?? 0));
      lastTurnAt[me] = r.seconds;
      const cmd = decide(state, me, profile, rng, cfg);
      const needsChoice = cmd.type === "play" && cmd.useAbility;
      let think = lognormal(rng, MEDIAN_THINK[profile]) * (needsChoice ? 1.3 : 0.8);
      if (think > cfg.turnTimer) {
        // Server timeout: draw 1 and pass (a playable drawn card is kept).
        think = cfg.turnTimer;
        r.timeouts++;
        r.seconds += think + ANIMATION_S;
        t = discard.applyCommand(state, { type: "draw", playerId }, rng);
        if (t.state.drawn) {
          const k = discard.applyCommand(t.state, { type: "keep", playerId }, rng);
          t = { state: k.state, events: [...t.events, ...k.events] };
        }
      } else {
        r.seconds += think + ANIMATION_S;
        t = safePlay(state, cmd, rng);
      }
    }
    const usedAbility = (id: discard.AbilityId) =>
      t.events.some((e) => e.type === "ability" && e.seat === me && e.ability === id);
    if (cfg.magnifierExtra && usedAbility("peek")) t = extraShed(t, me, false);
    if (
      cfg.boxShed &&
      t.events.some((e) => e.type === "played" && e.seat === me && e.cardIds.includes("D05"))
    )
      t = extraShed(t, me, true, cfg.boxShedMax);
    for (const e of t.events) {
      if (e.type === "ability") {
        r.abilities++;
        r.abilityUse[e.ability] = (r.abilityUse[e.ability] ?? 0) + 1;
      }
      if (e.type === "played") r.cardsPlayed += e.cardIds.length;
      if (e.type === "drew" && e.seat !== me && e.count > 0) {
        r.forcedDraws += e.count;
        hits[e.seat] = (hits[e.seat] ?? 0) + 1;
      }
      if (e.type === "skipped") {
        r.skips++;
        hits[e.seat] = (hits[e.seat] ?? 0) + 1;
      }
      if (e.type === "drew") r.cardsDrawn += e.count;
      if (e.type === "pile_reset") r.resets++;
      if (e.type === "umbrella") r.umbrellas++;
    }
    state = t.state;
  }
  r.maxHitsOnOne = Math.max(0, ...hits);
  r.hopeless = state.players.filter(
    (p, i) => i !== state.winner && p.hand.length >= 2 * cfg.hand(players),
  ).length;
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
    turnsPerPlayer: mean(fin.map((r) => r.turns)) / players,
    cardsPlayed: mean(fin.map((r) => r.cardsPlayed)),
    forcedDraws: mean(fin.map((r) => r.forcedDraws)),
    skips: mean(fin.map((r) => r.skips)),
    maxHitsP90: pct(
      fin.map((r) => r.maxHitsOnOne),
      90,
    ),
    hopelessPct:
      (fin.reduce((a, r) => a + r.hopeless, 0) / Math.max(fin.length * (players - 1), 1)) * 100,
    /** Win % by turn position (0 = first player). */
    seatWin: Array.from(
      { length: players },
      (_, k) =>
        (fin.filter((r) => r.winner !== null && (r.winner - r.first + players) % players === k)
          .length /
          Math.max(fin.length, 1)) *
        100,
    ),
    abilityPerGame: Object.fromEntries(
      discard.DISCARD_CARDS.map((c) => [
        c.ability,
        mean(fin.map((r) => r.abilityUse[c.ability] ?? 0)),
      ]),
    ),
    /** Win % of a seat whose opening hand holds the card (fair = 100 / players). */
    cardWin: Object.fromEntries(
      discard.DISCARD_CARDS.map((c) => {
        let had = 0;
        let won = 0;
        for (const r of fin)
          r.opening.forEach((hand, i) => {
            if (hand.includes(c.cardId)) {
              had++;
              if (r.winner === i) won++;
            }
          });
        return [c.cardId, (won / Math.max(had, 1)) * 100];
      }),
    ),
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
    const only = process.env["AUMMON_SIM_ONLY"];
    for (const cfg of CONFIGS)
      if (!only || cfg.name.includes(only))
        for (let n = 2; n <= 8; n++) rows.push(summarize(cfg, n, full));
    const ablation = [];
    const base = CONFIGS[0];
    if (base && !only)
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
