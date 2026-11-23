import {
  cardPoints,
  DUMMY_RULES,
  isValidMeld,
  rankNo,
  suitOf,
  type Card,
  type DummyCommand,
  type DummyState,
} from "./engine.ts";
import { getDummyView } from "./view.ts";

/** Greedy meld search in a hand: sets first, then the longest same-suit runs. */
export function findMelds(hand: readonly Card[]): Card[][] {
  const left = [...hand];
  const out: Card[][] = [];
  const byRank = new Map<number, Card[]>();
  for (const c of left) byRank.set(rankNo(c), [...(byRank.get(rankNo(c)) ?? []), c]);
  for (const group of byRank.values())
    if (group.length >= 3) {
      out.push(group.slice(0, 4));
      for (const c of group.slice(0, 4)) left.splice(left.indexOf(c), 1);
    }
  for (const suit of "cdhs") {
    for (const high of [false, true]) {
      const val = (c: Card) => (high && rankNo(c) === 1 ? 14 : rankNo(c));
      const cards = left.filter((c) => suitOf(c) === suit).sort((a, b) => val(a) - val(b));
      let run: Card[] = [];
      const flush = () => {
        if (run.length >= 3) {
          out.push(run);
          for (const c of run) left.splice(left.indexOf(c), 1);
        }
      };
      for (const c of cards) {
        const prev = run[run.length - 1];
        if (prev !== undefined && val(c) === val(prev) + 1) run.push(c);
        else {
          flush();
          run = [c];
        }
      }
      flush();
    }
  }
  return out.filter((m) => isValidMeld(m));
}

/** A meld from `hand` that contains `card`, or null. */
function meldWith(hand: readonly Card[], card: Card): Card[] | null {
  for (const m of findMelds([...hand, card])) if (m.includes(card)) return m;
  return null;
}

/** Which discard is least useful to us (and to others): unconnected, not speto, high points first. */
function chooseDiscard(hand: readonly Card[], table: readonly (readonly Card[])[]): Card {
  const fitsTable = (c: Card) => table.some((m) => isValidMeld([...m, c]));
  const connected = (c: Card) =>
    hand.some(
      (o) =>
        o !== c &&
        (rankNo(o) === rankNo(c) ||
          (suitOf(o) === suitOf(c) && Math.abs(rankNo(o) - rankNo(c)) <= 2)),
    );
  const score = (c: Card) =>
    (DUMMY_RULES.speto.includes(c) ? -1000 : 0) +
    (fitsTable(c) ? -200 : 0) +
    (connected(c) ? -50 : 0) +
    cardPoints(c);
  return [...hand].sort((a, b) => score(b) - score(a))[0] ?? hand[0] ?? "";
}

/** Bot decision from its own view (own hand + public table). */
export function chooseDummyBotCommand(s: DummyState, seat: number): DummyCommand {
  const v = getDummyView(s, seat);
  const hand = v.myHand;
  const table = v.melds.map((m) => m.cards);
  if (v.phase === "draw") {
    const index = v.discard.length - 1;
    const top = v.discard[index];
    if (top !== undefined) {
      const meld = meldWith(hand, top);
      if (meld) return { type: "pick", index, meld };
      const layoff = table.findIndex((m) => isValidMeld([...m, top]));
      if (layoff >= 0) return { type: "pick", index, layoff };
    }
    return { type: "draw" };
  }
  // Keep at least one card to discard unless melding everything wins (knock).
  const melds = findMelds(hand);
  const first = melds[0];
  if (first) return { type: "meld", cards: first };
  for (const c of hand) {
    const i = table.findIndex((m) => isValidMeld([...m, c]));
    if (i >= 0 && hand.length > 1) return { type: "layoff", meld: i, cards: [c] };
  }
  return { type: "discard", card: chooseDiscard(hand, table) };
}

export const dummyTimeoutDiscard = (s: DummyState, seat: number): DummyCommand => ({
  type: "discard",
  card: chooseDiscard(
    s.players[seat]?.hand ?? [],
    s.melds.map((m) => m.cards),
  ),
});
