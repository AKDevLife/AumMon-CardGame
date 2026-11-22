// POST { roomId } → { matchId }   (online room owner; 2–8 ready players)
import { requireUser } from "../_shared/auth.ts";
import { startOnlineGame } from "../_shared/game.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return { matchId: await startOnlineGame(userId, uuid(body, "roomId")) };
  }),
);
