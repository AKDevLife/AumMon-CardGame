/** EDO Battle server hooks: playtest telemetry in private.round_stats (task 12.16, aggregates only). */
import { discard, RULESET_VERSION } from "@aummon/game-engine";
import type { GameHooks } from "../game.ts";

const asState = (s: unknown) => s as discard.GameState;
const asEvents = (e: readonly { readonly type: string }[]) => e as readonly discard.GameEvent[];

export const edoHooks: GameHooks = {
  async onStart(tx, matchId, raw, mode, seats) {
    const state = asState(raw);
    await tx`
      insert into private.round_stats (match_id, ruleset_version, mode, players, humans, opening)
      values (${matchId}, ${RULESET_VERSION}, ${mode}, ${seats.length},
              ${seats.filter((x) => x.player_type === "human").length},
              ${tx.json(state.players.map((p) => p.hand.map((c) => c.cardId)))})`;
  },

  async onSave(tx, locked, raw, rawEvents) {
    const state = asState(raw);
    const events = asEvents(rawEvents);
    const abilities: Record<string, number> = {};
    for (const e of events)
      if (e.type === "ability") abilities[e.ability] = (abilities[e.ability] ?? 0) + 1;
    const timeouts = events.filter((e) => e.type === "timeout").length;
    const finished = state.status === "finished";
    const winnerKind =
      state.winner === null
        ? null
        : (locked.seats.find((x) => x.seat - 1 === state.winner)?.player_type ?? null);
    await tx`
      update private.round_stats set
        turns = ${state.turnNumber},
        timeouts = timeouts + ${timeouts},
        abilities = abilities || coalesce((
          select jsonb_object_agg(n.key, n.value::int + coalesce((round_stats.abilities ->> n.key)::int, 0))
          from jsonb_each_text(${tx.json(abilities)}::jsonb) n), '{}'::jsonb),
        finished_at = ${finished ? tx`now()` : null},
        winner_seat = ${state.winner},
        winner_kind = ${winnerKind}
      where match_id = ${locked.matchId}`;
  },

  // Decision time of this human action (from the start of the turn timer) + Draw Then Play usage.
  async onHumanAction(tx, locked, before, seat, rawEvents, now) {
    const state = asState(before.state);
    const startedAt =
      before.deadline === null ? null : before.deadline - discard.DISCARD_RULES.turnTimeoutMs;
    const drawnPlay =
      state.drawn?.seat === seat &&
      asEvents(rawEvents).some((e) => e.type === "played" && e.seat === seat);
    await tx`
      update private.round_stats set decisions = decisions + 1,
        decision_ms = decision_ms + ${startedAt === null ? 0 : Math.max(0, Math.min(now - startedAt, 60_000))},
        drawn_plays = drawn_plays + ${drawnPlay ? 1 : 0}
      where match_id = ${locked.matchId}`;
  },
};
