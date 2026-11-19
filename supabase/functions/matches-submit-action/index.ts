// POST SubmitActionCommand → { status, view, deadline }   (blueprint §4.5–4.6, §7)
import { submitAction } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { advance } from "../_shared/flow.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, optionalOneOf, optionalUuid, rejectServerFields, uuid } from "../_shared/input.ts";
import { respond } from "../_shared/matches.ts";
import { findReceipt, hashRequest, storeReceipt } from "../_shared/receipts.ts";
import { lockMatch, saveMatch } from "../_shared/store.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    rejectServerFields(body);
    const command = {
      matchId: uuid(body, "matchId"),
      roundNumber: int(body, "roundNumber", 1, 10_000),
      expectedVersion: int(body, "expectedVersion", 0, 1_000_000),
      cardInstanceId: uuid(body, "cardInstanceId"),
      idempotencyKey: uuid(body, "idempotencyKey"),
    };
    const targetPlayerId = optionalUuid(body, "targetPlayerId");
    const choice = optionalOneOf(body, "choice", ["heal", "draw"] as const);
    const full = {
      ...command,
      ...(targetPlayerId && { targetPlayerId }),
      ...(choice && { choice }),
    };
    const requestHash = await hashRequest(full);

    return db().begin(async (tx) => {
      const locked = await lockMatch(tx, command.matchId, userId);
      const previous = await findReceipt(
        tx,
        command.matchId,
        userId,
        command.idempotencyKey,
        requestHash,
      );
      if (previous !== undefined) return previous;
      if (!locked.viewerPlayerId)
        throw new HttpError(403, "not_a_player", "You have no seat in this match");

      // Apply due timeouts/bots first so the command is checked against current state.
      const current = advance(locked, Date.now());
      const out = submitAction(current.state, locked.viewerPlayerId, full);
      if (!out.transition) {
        if (current.events.length > 0)
          await saveMatch(tx, command.matchId, current, current.events);
        throw new HttpError(
          409,
          out.result.ok ? "rejected" : out.result.code,
          out.result.ok ? "" : out.result.message,
        );
      }
      const next = advance({ ...current, state: out.transition.state }, Date.now());
      await saveMatch(tx, command.matchId, next, [
        ...current.events,
        ...out.transition.events,
        ...next.events,
      ]);
      const response = { status: "accepted", ...(await respond(tx, locked, next)) };
      await storeReceipt(tx, command.matchId, userId, command.idempotencyKey, requestHash, {
        status: "accepted",
        version: next.state.version,
      });
      return response;
    });
  }),
);
