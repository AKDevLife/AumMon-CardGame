// POST { mode: "online", maxPlayers?: 2–8, gameId?: "edo_battle" } → { roomId, joinCode }
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { gameId, int, oneOf } from "../_shared/input.ts";
import { createOnlineRoom } from "../_shared/lobby.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    oneOf(body, "mode", ["online"] as const);
    return createOnlineRoom(
      userId,
      body["maxPlayers"] === undefined ? undefined : int(body, "maxPlayers", 2, 8),
      gameId(body),
    );
  }),
);
