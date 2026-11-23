// POST { mode: "solo", bots: 1–7, gameId?: "edo_battle" } → { matchId }
import { requireUser } from "../_shared/auth.ts";
import { createGame } from "../_shared/game.ts";
import { handler, readJson } from "../_shared/http.ts";
import { gameId, int, oneOf } from "../_shared/input.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    oneOf(body, "mode", ["solo"] as const);
    return { matchId: await createGame(userId, int(body, "bots", 1, 7), gameId(body)) };
  }),
);
