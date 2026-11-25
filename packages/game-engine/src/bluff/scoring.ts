/**
 * BLUFF round scoring, ruleset "2" (docs/v2/AumMon_Flagship_Game_Bluff.md §4 +
 * docs/v2/AumMon_Player_Count_Design.md §3). Pure; null = no answer / prediction (timeout).
 */
export type Option = 0 | 1 | 2 | 3;
export const OPTIONS: readonly Option[] = [0, 1, 2, 3];

export interface SeatInput {
  readonly answer: Option | null;
  readonly prediction: Option | null;
  readonly wager: 0 | 1 | 2;
  /** Claimed option ("ฉันเลือก X"), or null for no claim / taunt only. */
  readonly claim: Option | null;
}

export interface SeatScore {
  readonly prediction: number;
  readonly crowd: number;
  readonly bluff: number;
  readonly honest: number;
  /** Sum before the final-round multiplier. */
  readonly base: number;
  /** Points added to the match score (base × multiplier). */
  readonly total: number;
  readonly hit: boolean;
  /** Option(s) that counted as "Top" for this seat. */
  readonly top: readonly Option[];
}

export const bluffCap = (n: number): number => (n === 2 ? 0 : n >= 5 ? 2 : 1);
const honestPoints = (n: number): number => (n === 2 ? 0 : 1);

/** Votes per option among `seats` answers (null answers are not counted). */
export function votes(inputs: readonly SeatInput[], except?: number): number[] {
  const v = [0, 0, 0, 0];
  inputs.forEach((s, i) => {
    if (i !== except && s.answer !== null) v[s.answer] = (v[s.answer] ?? 0) + 1;
  });
  return v;
}

/** "Top" for seat i = most-picked option(s) among the other players (2p: the opponent's answer). */
export function topFor(inputs: readonly SeatInput[], i: number): Option[] {
  const v = votes(inputs, i);
  const max = Math.max(...v);
  if (max === 0) return [];
  return OPTIONS.filter((k) => v[k] === max);
}

export function scoreRound(inputs: readonly SeatInput[], multiplier: number): SeatScore[] {
  const n = inputs.length;
  const all = votes(inputs);
  const maxAll = Math.max(...all);
  const tops = inputs.map((_, i) => topFor(inputs, i));
  return inputs.map((s, i) => {
    const top = tops[i] ?? [];
    const hit = s.prediction !== null && top.includes(s.prediction);
    const prediction = s.prediction === null ? 0 : hit ? 2 + s.wager : 0 - s.wager;
    const crowd = n >= 3 && s.answer !== null && maxAll > 0 && all[s.answer] === maxAll ? 1 : 0;
    let bluff = 0;
    let honest = 0;
    if (s.claim !== null && s.answer !== null) {
      const claim = s.claim;
      const believers = inputs.filter((o, j) => j !== i && o.prediction === claim);
      if (claim !== s.answer) {
        const fooled = inputs.filter(
          (o, j) => j !== i && o.prediction === claim && !(tops[j] ?? []).includes(claim),
        ).length;
        bluff = Math.min(fooled, bluffCap(n));
      } else if (believers.length > 0) honest = honestPoints(n);
    }
    const base = prediction + crowd + bluff + honest;
    return { prediction, crowd, bluff, honest, base, total: base * multiplier, hit, top };
  });
}

/** Final ranking: score → correct predictions → Bluff + Honest points; equal keys share a place. */
export function placements(
  scores: readonly number[],
  hits: readonly number[],
  reads: readonly number[],
): number[] {
  const key = (i: number) => [scores[i] ?? 0, hits[i] ?? 0, reads[i] ?? 0] as const;
  const better = (a: number, b: number) => {
    const [x, y] = [key(a), key(b)];
    for (let k = 0; k < 3; k++) if (x[k] !== y[k]) return (x[k] ?? 0) > (y[k] ?? 0);
    return false;
  };
  return scores.map((_, i) => 1 + scores.filter((__, j) => better(j, i)).length);
}
