// POST { matchId } → { view }   The caller's seat surrenders (online/solo; not for Pass & Play seats).
import { forfeit } from "@aummon/game-engine";
import { requireUser } from "../_shared/auth.ts";
import { handler, HttpError, readJson } from "../_shared/http.ts";
import { uuid } from "../_shared/input.ts";
import { withMatch } from "../_shared/matches.ts";

Deno.serve(
  handler(async (request) => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    return withMatch(userId, uuid(body, "matchId"), (locked) => {
      if (!locked.viewerPlayerId)
        throw new HttpError(403, "not_a_player", "You have no seat in this match");
      try {
        return forfeit(locked.state, locked.viewerPlayerId);
      } catch {
        throw new HttpError(409, "cannot_forfeit", "You cannot forfeit now");
      }
    });
  }),
);
