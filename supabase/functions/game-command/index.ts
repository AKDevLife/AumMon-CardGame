// POST { matchId, expectedVersion, idempotencyKey, command } → GameResponse
// Intent only: the match's game module parses the command; the server picks the acting seat
// and computes every result.
import { requireUser } from "../_shared/auth.ts";
import { withGame } from "../_shared/game.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, rejectServerFields, uuid } from "../_shared/input.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { hashRequest } from "../_shared/receipts.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    rejectServerFields(body);
    const matchId = uuid(body, "matchId");
    const expectedVersion = int(body, "expectedVersion", 0, 10_000_000);
    const key = uuid(body, "idempotencyKey");
    const command = body["command"];
    if (typeof command !== "object" || command === null)
      throw new HttpError(400, "invalid_input", "command required");
    const hash = await hashRequest({ matchId, expectedVersion, command });
    await rateLimit(userId, "match.submit", 120, 60);
    const response = await withGame(userId, matchId, {
      command,
      expectedVersion,
      receipt: { key, hash },
    });
    return { status: "accepted", ...(response as object) };
  }),
);
