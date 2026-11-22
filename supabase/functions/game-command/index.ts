// POST { matchId, expectedVersion, idempotencyKey, command } → GameResponse
// Intent only: the server picks the acting seat and computes every result.
import { discard } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { withGame } from "../_shared/game.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, rejectServerFields, uuid } from "../_shared/input.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { hashRequest } from "../_shared/receipts.ts";

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

function idValue(v: unknown, label: string): string {
  if (typeof v !== "string" || !ID_RE.test(v))
    throw new HttpError(400, "invalid_input", `${label} invalid`);
  return v;
}

function parseChoice(raw: unknown): discard.AbilityChoice {
  if (raw === undefined) return {};
  if (typeof raw !== "object" || raw === null)
    throw new HttpError(400, "invalid_input", "choice invalid");
  const c = raw as Record<string, unknown>;
  const out: { target?: number; card?: string; pair?: [string, string] } = {};
  if (c["target"] !== undefined) {
    if (
      typeof c["target"] !== "number" ||
      !Number.isInteger(c["target"]) ||
      c["target"] < 0 ||
      c["target"] > 7
    )
      throw new HttpError(400, "invalid_input", "target invalid");
    out.target = c["target"];
  }
  if (c["card"] !== undefined) out.card = idValue(c["card"], "card");
  if (c["pair"] !== undefined) {
    if (!Array.isArray(c["pair"]) || c["pair"].length !== 2)
      throw new HttpError(400, "invalid_input", "pair invalid");
    out.pair = [idValue(c["pair"][0], "pair"), idValue(c["pair"][1], "pair")];
  }
  return out;
}

type Intent =
  | { type: "play"; card: string; useAbility: boolean; choice: discard.AbilityChoice }
  | { type: "draw" }
  | { type: "react"; useUmbrella: boolean };

function parseCommand(raw: unknown): Intent {
  if (typeof raw !== "object" || raw === null)
    throw new HttpError(400, "invalid_input", "command required");
  const c = raw as Record<string, unknown>;
  switch (c["type"]) {
    case "play":
      return {
        type: "play",
        card: idValue(c["card"], "card"),
        useAbility: c["useAbility"] === true,
        choice: parseChoice(c["choice"]),
      };
    case "draw":
      return { type: "draw" };
    case "react":
      return { type: "react", useUmbrella: c["useUmbrella"] === true };
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
    const response = await withGame(userId, matchId, {
      // Umbrella answers may arrive while the version moves (other reactions); others must be fresh.
      ...(intent.type !== "react" && { expectedVersion }),
      receipt: { key, hash },
      act: (state, seat, rng) =>
        discard.applyCommand(
          state,
          { ...intent, playerId: state.players[seat]?.playerId ?? "" },
          rng,
        ),
    });
    return { status: "accepted", ...(response as object) };
  }),
);
