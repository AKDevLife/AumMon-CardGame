// POST { matchId, targetPlayerId? } → Aqua swap (target) or skip (no target)  (Rule 11; Q7; task 4.12)
import { createSeededRandom, useTurnStartSkill } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { optionalUuid, uuid } from "../_shared/input.ts";
import { withMatch } from "../_shared/matches.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const target = optionalUuid(body, "targetPlayerId");
    return withMatch(userId, uuid(body, "matchId"), (locked, actorId) => {
      if (!actorId) throw new HttpError(403, "not_your_turn", "No skill available for you now");
      const rng = createSeededRandom(locked.rng);
      try {
        const t = useTurnStartSkill(
          locked.state,
          actorId,
          target ? { kind: "swap", targetPlayerId: target } : { kind: "skip" },
          rng,
        );
        return { ...t, rng: rng.getState() };
      } catch (error) {
        throw new HttpError(
          409,
          "skill_not_available",
          error instanceof Error ? error.message : "Skill not available",
        );
      }
    });
  }),
);
