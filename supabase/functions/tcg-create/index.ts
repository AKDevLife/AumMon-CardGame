// POST { mode: "solo" } | { mode: "pass_play", names: [string, string] } → { matchId }   (ruleset 4)
import { requireUser } from "../_shared/auth.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { oneOf } from "../_shared/input.ts";
import { createTcgMatch } from "../_shared/tcg.ts";

const NAME_RE = /^[\p{L}\p{M}\p{N} _.-]{1,24}$/u;

function names(raw: unknown): [string, string] {
  if (!Array.isArray(raw) || raw.length !== 2)
    throw new HttpError(400, "invalid_seats", "Two names required");
  const [a, b] = raw.map((n: unknown) => (typeof n === "string" ? n.trim() : ""));
  if (!a || !b || !NAME_RE.test(a) || !NAME_RE.test(b))
    throw new HttpError(400, "invalid_name", "Names: 1–24 letters/numbers");
  return [a, b];
}

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const mode = oneOf(body, "mode", ["solo", "pass_play"] as const);
    const matchId = await createTcgMatch(
      userId,
      mode,
      mode === "pass_play" ? names(body["names"]) : null,
    );
    return { matchId };
  }),
);
