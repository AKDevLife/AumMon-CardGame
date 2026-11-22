// POST { confirm: "DELETE" } → { ok }   Task 7.4: delete the caller's account.
// Active matches are left first (online: a bot takes the seat); finished history stays anonymized (migration 20261120000100).
import { requireUser } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { leaveGame } from "../_shared/game.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    if (body["confirm"] !== "DELETE")
      throw new HttpError(400, "confirmation_required", 'Send { "confirm": "DELETE" }');
    await rateLimit(userId, "account.delete", 3, 3600);

    // 1. Leave every active online match the user is seated in (a bot takes the seat).
    const seats = await db()<{ match_id: string }[]>`
      select mp.match_id from public.match_players mp join public.matches m on m.id = mp.match_id
      join public.game_rooms r on r.id = m.room_id
      where mp.user_id = ${userId} and m.status = 'active' and r.mode = 'online'`;
    for (const { match_id } of seats) await leaveGame(userId, match_id);
    // 2. Pass & Play matches the user hosted cannot continue without the device owner.
    await db()`
      update public.matches m set status = 'abandoned', finished_at = now()
      from public.game_rooms r
      where r.id = m.room_id and r.owner_id = ${userId} and r.mode = 'pass_play' and m.status = 'active'`;
    await db()`update public.game_rooms set status = 'closed' where owner_id = ${userId} and status <> 'closed'`;

    // 3. Delete the auth user (service role, server only). Cascades/anonymizes via FKs + trigger.
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Supabase admin env not configured");
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`auth delete failed: ${res.status}`);
    return { ok: true };
  }),
);
