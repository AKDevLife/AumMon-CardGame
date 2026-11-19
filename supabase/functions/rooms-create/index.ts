// POST { mode: "solo", characterId, botCount } | { mode: "pass_play", seats: [{ displayName, characterId }] } → { roomId }
import { requireUser } from "../_shared/auth.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, oneOf } from "../_shared/input.ts";
import { createPassPlayRoom, createSoloRoom } from "../_shared/matches.ts";

const NAME_RE = /^[\p{L}\p{M}\p{N} _.-]{1,24}$/u;

function localSeats(raw: unknown) {
  if (!Array.isArray(raw)) throw new HttpError(400, "invalid_input", "seats must be an array");
  return raw.map((s: unknown) => {
    const seat = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
    const displayName = typeof seat["displayName"] === "string" ? seat["displayName"].trim() : "";
    const characterId = typeof seat["characterId"] === "string" ? seat["characterId"] : "";
    if (!NAME_RE.test(displayName))
      throw new HttpError(400, "invalid_name", "Seat names: 1–24 letters/numbers");
    return { displayName, characterId };
  });
}

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const mode = oneOf(body, "mode", ["solo", "pass_play", "online"] as const);
    if (mode === "pass_play")
      return { roomId: await createPassPlayRoom(userId, localSeats(body["seats"])) };
    if (mode !== "solo")
      throw new HttpError(400, "unsupported_mode", "Online rooms use the lobby (Phase 6)");
    const characterId = typeof body["characterId"] === "string" ? body["characterId"] : "";
    const botCount = int(body, "botCount", 1, 3);
    return { roomId: await createSoloRoom(userId, characterId, botCount) };
  }),
);
