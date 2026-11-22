// POST { mode: "online", maxPlayers?: 2–8 } → { roomId, joinCode }   (solo / pass & play use game-create)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { int, oneOf } from "../_shared/input.ts";
import { createOnlineRoom } from "../_shared/lobby.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    oneOf(body, "mode", ["online"] as const);
    return createOnlineRoom(
      userId,
      body["maxPlayers"] === undefined ? 4 : int(body, "maxPlayers", 2, 8),
    );
  }),
);
