// POST { roomId, ready } → { ok }
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { setReady } from "../_shared/lobby.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return setReady(userId, uuid(body, "roomId"), body["ready"] === true);
  }),
);
