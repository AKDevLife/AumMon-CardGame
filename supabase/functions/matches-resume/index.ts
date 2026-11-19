// POST { matchId } → { view, deadline }   Reconnect: state always comes from the server (blueprint §6.3).
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { withMatch } from "../_shared/matches.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return withMatch(userId, uuid(body, "matchId"));
  }),
);
