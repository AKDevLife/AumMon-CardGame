import { HttpError } from "./http.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function uuid(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (typeof v !== "string" || !UUID_RE.test(v))
    throw new HttpError(400, "invalid_input", `${key} must be a UUID`);
  return v.toLowerCase();
}

export function optionalUuid(body: Record<string, unknown>, key: string): string | undefined {
  return body[key] === undefined || body[key] === null ? undefined : uuid(body, key);
}

export function int(body: Record<string, unknown>, key: string, min: number, max: number): number {
  const v = body[key];
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
    throw new HttpError(400, "invalid_input", `${key} must be an integer ${min}–${max}`);
  }
  return v;
}

export function oneOf<T extends string>(
  body: Record<string, unknown>,
  key: string,
  values: readonly T[],
): T {
  const v = body[key];
  const match = values.find((x) => x === v);
  if (match === undefined)
    throw new HttpError(400, "invalid_input", `${key} must be one of ${values.join(", ")}`);
  return match;
}

export function optionalOneOf<T extends string>(
  body: Record<string, unknown>,
  key: string,
  values: readonly T[],
): T | undefined {
  return body[key] === undefined || body[key] === null ? undefined : oneOf(body, key, values);
}

/** Reject fields the server computes (blueprint §7: never accept results from clients). */
export function rejectServerFields(body: Record<string, unknown>): void {
  for (const k of [
    "damage",
    "newHp",
    "hp",
    "winner",
    "resolvedState",
    "deckOrder",
    "phase",
    "speed",
  ]) {
    if (k in body) throw new HttpError(400, "forbidden_field", `Field ${k} is not accepted`);
  }
}

/** Optional game id (default: EDO Battle); availability is checked against public.games. */
export function gameId(body: Record<string, unknown>): string {
  const v = body["gameId"];
  if (v === undefined || v === null) return "edo_battle";
  if (typeof v !== "string" || !/^[a-z_]{2,32}$/.test(v))
    throw new HttpError(400, "invalid_input", "gameId invalid");
  return v;
}
