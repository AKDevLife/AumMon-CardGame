// POST { roomId } → { matchId, view, deadline }   (owner only)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { startMatch } from "../_shared/matches.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return startMatch(userId, uuid(body, "roomId"));
  }),
);
