/** Idempotency ledger (blueprint §4.6) in private.command_receipts. */
import { HttpError } from "./http.ts";
import type { Tx } from "./store.ts";

export async function hashRequest(payload: unknown): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Same key + same payload → stored response; same key + different payload → 409. */
export async function findReceipt(
  tx: Tx,
  matchId: string,
  userId: string,
  key: string,
  requestHash: string,
): Promise<unknown> {
  const rows = await tx<{ request_hash: string; response_payload: unknown }[]>`
    select request_hash, response_payload from private.command_receipts
    where match_id = ${matchId} and actor_user_id = ${userId} and idempotency_key = ${key}`;
  const row = rows[0];
  if (!row) return undefined;
  if (row.request_hash !== requestHash) {
    throw new HttpError(
      409,
      "idempotency_conflict",
      "Idempotency key reused with a different payload",
    );
  }
  return row.response_payload;
}

export async function storeReceipt(
  tx: Tx,
  matchId: string,
  userId: string,
  key: string,
  requestHash: string,
  response: unknown,
): Promise<void> {
  await tx`
    insert into private.command_receipts (match_id, actor_user_id, idempotency_key, request_hash, response_payload)
    values (${matchId}, ${userId}, ${key}, ${requestHash}, ${tx.json(response as never)})`;
}
