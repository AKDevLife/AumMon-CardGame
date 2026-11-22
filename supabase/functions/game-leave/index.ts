// POST { matchId } → { ok }   Online: a bot takes your seat. Solo / Pass & Play: the match ends.
import { requireUser } from "../_shared/auth.ts";
import { leaveGame } from "../_shared/game.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return leaveGame(userId, uuid(body, "matchId"));
  }),
);
