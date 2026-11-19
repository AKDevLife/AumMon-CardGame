// POST { matchId, targetPlayerId? } → Aqua swap (target) or skip (no target)  (Rule 11; Q7; task 4.12)
import { useTurnStartSkill, createSeededRandom } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { HttpError, handler, readJson } from "../_shared/http.ts";
import { optionalUuid, uuid } from "../_shared/input.ts";
import { withMatch } from "../_shared/matches.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const target = optionalUuid(body, "targetPlayerId");
    return withMatch(userId, uuid(body, "matchId"), (locked) => {
      if (!locked.viewerPlayerId)
        throw new HttpError(403, "not_a_player", "You have no seat in this match");
      const rng = createSeededRandom(locked.rng);
      try {
        const t = useTurnStartSkill(
          locked.state,
          locked.viewerPlayerId,
          target ? { kind: "swap", targetPlayerId: target } : { kind: "skip" },
          rng,
        );
        locked.rng = rng.getState();
        return t;
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
