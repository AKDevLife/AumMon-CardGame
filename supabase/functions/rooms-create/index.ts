// POST { mode: "online", maxPlayers?: 2–8, gameId?, settings?: { slow, humor 1–2, group } } → { roomId, joinCode }
import { requireCaller } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { gameId, int, oneOf } from "../_shared/input.ts";
import { createOnlineRoom } from "../_shared/lobby.ts";
import { rateLimit } from "../_shared/ratelimit.ts";

Deno.serve(
  handler(async (request) => {
    const { id: userId, isGuest } = await requireCaller(request);
    // Guests: at most 10 new rooms per hour (G3).
    if (isGuest) await rateLimit(userId, "room.create.guest", 10, 3600);
    const body = await readJson(request);
    oneOf(body, "mode", ["online"] as const);
    return createOnlineRoom(
      userId,
      body["maxPlayers"] === undefined ? undefined : int(body, "maxPlayers", 2, 8),
      gameId(body),
      body["settings"],
    );
  }),
);
