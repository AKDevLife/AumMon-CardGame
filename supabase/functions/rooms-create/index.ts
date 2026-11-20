// POST { mode: "online" } → { roomId, joinCode }   (ruleset 2 1v1 lobby; solo/pass & play use tcg-create)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { oneOf } from "../_shared/input.ts";
import { createOnlineRoom } from "../_shared/lobby.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    oneOf(body, "mode", ["online"] as const);
    return createOnlineRoom(userId);
  }),
);
