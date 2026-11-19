// POST { roomId } → { ok }   (owner leaving closes the lobby)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { leaveRoom } from "../_shared/lobby.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return leaveRoom(userId, uuid(body, "roomId"));
  }),
);
