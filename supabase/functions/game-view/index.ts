// POST { matchId, resume? } → GameResponse   (also applies due bots / timeouts)
import { requireUser } from "../_shared/auth.ts";
import { withGame } from "../_shared/game.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return withGame(userId, uuid(body, "matchId"), { resume: body["resume"] === true });
  }),
);
