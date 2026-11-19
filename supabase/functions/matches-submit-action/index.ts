// POST SubmitActionCommand → { status, view, deadline }   (blueprint §4.5–4.6, §7)
import { submitAction } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { advance } from "../_shared/flow.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { int, optionalOneOf, optionalUuid, rejectServerFields, uuid } from "../_shared/input.ts";
import { actorFor, respond } from "../_shared/matches.ts";
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
      // Apply due timeouts/bots first so the command is checked against current state.
      const current = advance(locked, Date.now());
      const actorId = actorFor(locked, current.state); // Pass & Play: server-chosen current seat
      if (!actorId) throw new HttpError(403, "not_your_turn", "You cannot act now");
      const out = submitAction(current.state, actorId, full);
      if (!out.transition) {
        // Throwing rolls back the transaction; due timeouts are re-applied on the next request.
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
