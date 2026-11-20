// POST { matchId, reveal? } → TcgResponse   (also applies due bots / turn timeouts)
import { requireUser } from "../_shared/auth.ts";
import { handler, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { withTcg } from "../_shared/tcg.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return withTcg(userId, uuid(body, "matchId"), { reveal: body["reveal"] === true });
  }),
);
