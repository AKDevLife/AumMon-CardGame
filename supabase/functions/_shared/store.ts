/** Shared DB types + RNG codec for private.match_runtime.rng_state (blueprint §1.4). */
import type { RngState } from "@aummon/game-engine";
import type { TransactionSql } from "npm:postgres@3.4.9";

export type Tx = TransactionSql;

export function encodeRng(state: RngState): Uint8Array {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  state.forEach((v, i) => {
    view.setUint32(i * 4, v);
  });
  return bytes;
}

export function decodeRng(bytes: Uint8Array): RngState {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12)];
}
