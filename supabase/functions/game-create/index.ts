// POST { mode: "solo", bots: 1–7 } | { mode: "pass_play", names: string[2–8] } → { matchId }
import { requireUser } from "../_shared/auth.ts";
import { createGame } from "../_shared/game.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, oneOf } from "../_shared/input.ts";

const NAME_RE = /^[\p{L}\p{M}\p{N} _.-]{1,24}$/u;

function names(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 8)
    throw new HttpError(400, "invalid_seats", "2–8 names required");
  const list = raw.map((n: unknown) => (typeof n === "string" ? n.trim() : ""));
  if (list.some((n) => !n || !NAME_RE.test(n)))
    throw new HttpError(400, "invalid_name", "Names: 1–24 letters/numbers");
  return list;
}

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const mode = oneOf(body, "mode", ["solo", "pass_play"] as const);
    const matchId =
      mode === "solo"
        ? await createGame(userId, "solo", { bots: int(body, "bots", 1, 7) })
        : await createGame(userId, "pass_play", { names: names(body["names"]) });
    return { matchId };
  }),
);
