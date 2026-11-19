// POST { mode: "solo", characterId, botCount } → { roomId }   (Solo: blueprint §6.1)
import { requireUser } from "../_shared/auth.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, oneOf } from "../_shared/input.ts";
import { createSoloRoom } from "../_shared/matches.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const mode = oneOf(body, "mode", ["solo", "pass_play", "online"] as const);
    if (mode !== "solo") throw new HttpError(400, "unsupported_mode", "Only solo is available yet");
    const characterId = typeof body["characterId"] === "string" ? body["characterId"] : "";
    const botCount = int(body, "botCount", 1, 3);
    return { roomId: await createSoloRoom(userId, characterId, botCount) };
  }),
);
