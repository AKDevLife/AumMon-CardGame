// POST { joinCode, characterId } → { roomId }   (join code hashed, expiring, rate-limited)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { joinRoom } from "../_shared/lobby.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const code = typeof body["joinCode"] === "string" ? body["joinCode"] : "";
    const characterId = typeof body["characterId"] === "string" ? body["characterId"] : "";
    return joinRoom(userId, code, characterId);
  }),
);
