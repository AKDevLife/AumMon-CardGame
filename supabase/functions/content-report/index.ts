// POST { contentId, matchId? } → { reported, hidden }   Player report "เนื้อหาไม่เหมาะสม" (C4).
import { requireUser } from "../_shared/auth.ts";
import { reportContent } from "../_shared/content.ts";
import { db } from "../_shared/db.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { optionalUuid } from "../_shared/input.ts";
import { rateLimit } from "../_shared/ratelimit.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    const id = body["contentId"];
    if (typeof id !== "string" || !/^[a-z0-9_-]{3,80}$/.test(id))
      throw new HttpError(400, "invalid_input", "contentId invalid");
    const matchId = optionalUuid(body, "matchId") ?? null;
    await rateLimit(userId, "content.report", 20, 3600);
    return db().begin((tx) => reportContent(tx, userId, id, matchId));
  }),
);
