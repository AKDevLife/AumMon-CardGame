import type { RandomSource } from "../rng/seeded-random.ts";
import { getDiscardCard, type AbilityId } from "./cards.ts";
import {
  applyCommand,
  canPlay,
  CommandError,
  nextSeat,
  type AbilityChoice,
  type CardInstance,
  type Command,
  type GameState,
  type Seat,
} from "./engine.ts";

/**
 * Normal bot (server-side only). It reads the full state for convenience but only uses
 * what its own seat may know: its hand, hand counts, the pile and turn order.
 */
const pts = (c: CardInstance) => getDiscardCard(c.cardId).points;

function fewestOpponent(s: GameState, me: Seat): Seat {
  let best = nextSeat(s, me);
  for (let seat = 0; seat < s.players.length; seat++)
    if (seat !== me && (s.players[seat]?.hand.length ?? 99) < (s.players[best]?.hand.length ?? 99))
      best = seat;
  return best;
}

function choiceFor(
  s: GameState,
  me: Seat,
  ability: AbilityId,
  played: CardInstance,
): AbilityChoice | null {
  const rest = (s.players[me]?.hand ?? []).filter((c) => c.id !== played.id);
  const lowest = [...rest].sort((a, b) => pts(a) - pts(b))[0];
  switch (ability) {
    case "flashlight":
      return { target: fewestOpponent(s, me) };
    case "glue":
      return lowest ? { target: fewestOpponent(s, me), card: lowest.id } : null;
    case "box": {
      const low = [...rest].filter((c) => pts(c) <= 3).sort((a, b) => pts(a) - pts(b))[0];
      return low ? { card: low.id } : {};
    }
    case "magnet":
    case "trash":
      return lowest ? { card: lowest.id } : null;
    case "scissors": {
      const extra = [...rest]
        .filter((c) => pts(c) >= pts(played))
        .sort((a, b) => pts(a) - pts(b))[0];
      return extra ? { card: extra.id } : {};
    }
    case "tape": {
      for (const a of rest)
        for (const b of rest) if (a.id < b.id && pts(a) === pts(b)) return { pair: [a.id, b.id] };
      return null;
    }
    case "hourglass": {
      const under = s.pile[s.pile.length - 1];
      const again = under ? getDiscardCard(under.cardId).ability : null;
      return again && again !== "hourglass" ? choiceFor(s, me, again, played) : {};
    }
    case "umbrella":
      return null;
    default:
      return {};
  }
}

export function chooseBotCommand(s: GameState, me: Seat, rng: RandomSource): Command {
  const playerId = s.players[me]?.playerId ?? "";
  if (s.reactions[0]?.target === me) return { type: "react", playerId, useUmbrella: true };
  const hand = s.players[me]?.hand ?? [];
  const drawnId = s.drawn?.seat === me ? s.drawn.id : null;
  // Draw Then Play: only the drawn card may follow; keep an Umbrella unless it is the last card.
  const playable = hand.filter(
    (c) =>
      canPlay(s, me, c) &&
      (drawnId === null ||
        (c.id === drawnId &&
          (getDiscardCard(c.cardId).ability !== "umbrella" || hand.length === 1))),
  );
  if (playable.length === 0)
    return drawnId === null ? { type: "draw", playerId } : { type: "keep", playerId };
  // Shed low cards first, keep Umbrella / Eraser for answers; last card always goes.
  const score = (c: CardInstance) => {
    const a = getDiscardCard(c.cardId).ability;
    return pts(c) + (a === "umbrella" ? 20 : 0) + (a === "eraser" && hand.length > 1 ? 10 : 0);
  };
  const sorted = [...playable].sort((a, b) => score(a) - score(b));
  const best = sorted[0];
  const tie = best ? sorted.filter((c) => score(c) === score(best)) : [];
  const card = tie[rng.nextInt(tie.length)];
  if (!card) return drawnId === null ? { type: "draw", playerId } : { type: "keep", playerId };
  const choice = choiceFor(s, me, getDiscardCard(card.cardId).ability, card);
  const withAbility: Command = {
    type: "play",
    playerId,
    card: card.id,
    useAbility: true,
    choice: choice ?? {},
  };
  if (choice !== null) {
    try {
      applyCommand(s, withAbility, rng);
      return withAbility;
    } catch (e) {
      if (!(e instanceof CommandError)) throw e;
    }
  }
  return { type: "play", playerId, card: card.id, useAbility: false };
}
