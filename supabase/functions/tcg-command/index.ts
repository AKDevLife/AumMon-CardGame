// POST { matchId, expectedVersion, idempotencyKey, command: { type, ... } } → TcgResponse
// Intent only: the server picks the acting seat and computes every result (spec §1.3).
import { v5 } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, rejectServerFields, uuid } from "../_shared/input.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { hashRequest } from "../_shared/receipts.ts";
import { withTcg } from "../_shared/tcg.ts";

type Intent = { type: string } & Record<string, unknown>;
const ID_RE = /^[A-Za-z0-9:+_-]{1,120}$/;

function idValue(v: unknown, label: string): string {
  if (typeof v !== "string" || !ID_RE.test(v))
    throw new HttpError(400, "invalid_input", `${label} invalid`);
  return v;
}

function idList(v: unknown, label: string, min: number, max: number): string[] {
  if (!Array.isArray(v) || v.length < min || v.length > max)
    throw new HttpError(400, "invalid_input", `${label} invalid`);
  return v.map((x: unknown) => idValue(x, label));
}

function parseCommand(raw: unknown): Intent {
  if (typeof raw !== "object" || raw === null)
    throw new HttpError(400, "invalid_input", "command required");
  const c = raw as Record<string, unknown>;
  switch (c["type"]) {
    case "mulligan":
      return { type: "mulligan", instanceIds: idList(c["instanceIds"], "instanceIds", 0, 5) };
    case "summon":
      return { type: "summon", instanceId: idValue(c["instanceId"], "instanceId") };
    case "activate":
      return c["target"] === undefined
        ? { type: "activate", instanceId: idValue(c["instanceId"], "instanceId") }
        : {
            type: "activate",
            instanceId: idValue(c["instanceId"], "instanceId"),
            target: idValue(c["target"], "target"),
          };
    case "attack":
      return {
        type: "attack",
        attackerId: idValue(c["attackerId"], "attackerId"),
        target: idValue(c["target"], "target"),
      };
    case "end_turn":
    case "forfeit":
      return { type: c["type"] };
    default:
      throw new HttpError(400, "invalid_input", "unknown command type");
  }
}

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    rejectServerFields(body);
    const matchId = uuid(body, "matchId");
    const expectedVersion = int(body, "expectedVersion", 0, 10_000_000);
    const key = uuid(body, "idempotencyKey");
    const intent = parseCommand(body["command"]);
    const hash = await hashRequest({ matchId, expectedVersion, intent });
    await rateLimit(userId, "match.submit", 120, 60);
    const response = await withTcg(userId, matchId, {
      // Forfeit is valid at any moment, so it must not fail on a stale view; the
      // idempotency key still prevents a duplicate.
      ...(intent.type !== "forfeit" && { expectedVersion }),
      receipt: { key, hash },
      act: (state, seat, rng) =>
        // Shape validated above; the engine validates every rule and throws CommandError otherwise.
        v5.applyCommand(
          state,
          { ...intent, playerId: state.players[seat].playerId } as v5.Command,
          rng,
        ),
    });
    return { status: "accepted", ...(response as object) };
  }),
);
