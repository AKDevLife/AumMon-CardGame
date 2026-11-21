// POST { roomId } → { matchId }   (online ruleset 4 room, owner only)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { startOnlineTcg } from "../_shared/tcg.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return { matchId: await startOnlineTcg(userId, uuid(body, "roomId")) };
  }),
);
