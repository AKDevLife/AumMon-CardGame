// POST { action: "join", gameId, players } | { action: "status" } | { action: "cancel" } → QueueStatus
// Quick Match: automatic matchmaking (server forms tables; bots fill after a wait).
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { gameId, int, oneOf } from "../_shared/input.ts";
import { joinQueue, leaveQueue, queueStatus } from "../_shared/matchmaking.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const action = oneOf(body, "action", ["join", "status", "cancel"] as const);
    if (action === "join") return joinQueue(userId, gameId(body), int(body, "players", 2, 8));
    if (action === "status") return queueStatus(userId);
    return leaveQueue(userId);
  }),
);
