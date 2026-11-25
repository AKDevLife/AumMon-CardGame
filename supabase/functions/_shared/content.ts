/**
 * Game content (docs/v2/AumMon_Content_Management.md): only `approved` items reach matches;
 * the server picks them (the engine never reads the database) and clients never browse the pool.
 */
import { HttpError } from "./http.ts";
import type { Tx } from "./store.ts";

export interface RoomSettings {
  /** Every phase timer × 1.5. */
  slow: boolean;
  /** Highest humor level allowed (1 สุภาพ · 2 แซวได้). */
  humor: 1 | 2;
  /** Prompts about people in the room (`group` tag), 3+ players only. */
  group: boolean;
}

export const DEFAULT_SETTINGS: RoomSettings = { slow: false, humor: 2, group: false };

/** Validates host settings from a request or a stored room row (unknown keys rejected). */
export function parseSettings(raw: unknown): RoomSettings {
  if (raw === undefined || raw === null) return { ...DEFAULT_SETTINGS };
  if (typeof raw !== "object" || Array.isArray(raw))
    throw new HttpError(400, "invalid_input", "settings must be an object");
  const r = raw as Record<string, unknown>;
  for (const k of Object.keys(r))
    if (!["slow", "humor", "group"].includes(k))
      throw new HttpError(400, "invalid_input", `settings.${k} is not allowed`);
  const humor = r["humor"] ?? DEFAULT_SETTINGS.humor;
  if (humor !== 1 && humor !== 2) throw new HttpError(400, "invalid_input", "settings.humor 1–2");
  for (const k of ["slow", "group"])
    if (r[k] !== undefined && typeof r[k] !== "boolean")
      throw new HttpError(400, "invalid_input", `settings.${k} must be boolean`);
  return { slow: r["slow"] === true, humor, group: r["group"] === true };
}

export interface PickedItem {
  id: string;
  version: number;
  prompt: string;
  options: [string, string, string, string];
}

/** Picks `count` approved BLUFF items for a room (random, no repeats). */
export async function pickBluffItems(
  tx: Tx,
  players: number,
  settings: RoomSettings,
  count = 5,
): Promise<PickedItem[]> {
  const rows = await tx<
    { id: string; version: number; body: { prompt: string; options: string[] } }[]
  >`
    select id, version, body from private.content_items
    where game_id = 'bluff' and status = 'approved' and locale = 'th'
      and min_players <= ${players} and max_players >= ${players}
      and humor <= ${settings.humor}
      and (${settings.group} or not ('group' = any(tags)))
      and 'casual' = any(modes)
    order by random() limit ${count}`;
  if (rows.length < count)
    throw new HttpError(
      409,
      "not_enough_content",
      `Need ${String(count)} approved questions for this room (found ${String(rows.length)})`,
    );
  return rows.map((r) => {
    const [a = "", b = "", c = "", d = ""] = r.body.options;
    return { id: r.id, version: r.version, prompt: r.body.prompt, options: [a, b, c, d] };
  });
}

/** Player report; 3 reports from different players move an approved item back to review (C4). */
export async function reportContent(
  tx: Tx,
  userId: string,
  contentId: string,
  matchId: string | null,
): Promise<{ reported: true; hidden: boolean }> {
  const [item] = await tx<{ status: string }[]>`
    select status from private.content_items where id = ${contentId} for update`;
  if (!item) throw new HttpError(404, "not_found", "Content not found");
  await tx`insert into private.content_reports (content_id, user_id, match_id)
    values (${contentId}, ${userId}, ${matchId}) on conflict do nothing`;
  const [{ n } = { n: 0 }] = await tx<{ n: number }[]>`
    select count(*)::int as n from private.content_reports where content_id = ${contentId}`;
  const hide = n >= 3 && item.status === "approved";
  if (hide)
    await tx`update private.content_items set status = 'in_review',
      review_note = 'auto: 3 player reports', updated_at = now() where id = ${contentId}`;
  return { reported: true, hidden: hide };
}
