/**
 * EDO Battle match flow — thin wrapper over the platform flow (`sdk.advance`) kept for the
 * existing server code and tests. No I/O; `now` is injected.
 */
import { edoBattle, sdk, type discard } from "@aummon/game-engine";

export type Kind = sdk.Kind;
export type Mode = "solo" | "online";
export type GameRuntime = sdk.Runtime<discard.GameState>;

export const BOT_STEP_MS = sdk.BOT_STEP_MS;
export const GRACE_MS = sdk.GRACE_MS;

export const actingSeat = (s: discard.GameState): number | null => edoBattle.actingSeat(s);

export const effectiveKinds = (kinds: readonly Kind[], timeouts: readonly number[], mode: Mode) =>
  sdk.effectiveKinds(kinds, timeouts, mode, edoBattle.afkTimeouts);

export const deadlineAfterAct = (
  before: discard.GameState,
  after: discard.GameState,
  deadline: number | null,
) => sdk.deadlineAfterAct(edoBattle, before, after, deadline);

export const advanceGame = (
  input: GameRuntime,
  kinds: readonly Kind[],
  now: number,
  mode: Mode = "solo",
) => sdk.advance(edoBattle, input, kinds, now, mode);
