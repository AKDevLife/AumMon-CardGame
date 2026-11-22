// POST { matchId } → { matchId }   "เล่นอีกรอบ": new match in the same room with the same seats.
import { requireUser } from "../_shared/auth.ts";
import { rematch } from "../_shared/game.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return rematch(userId, uuid(body, "matchId"));
  }),
);
