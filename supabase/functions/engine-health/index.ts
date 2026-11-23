// Minimal Edge Function proving the pure engines load under Deno (task 4.1, Game Center).
// Returns only public version info; no auth needed, no data access.
import { ENGINE_VERSION, GAME_MODULES, RULESET_VERSION } from "@aummon/game-engine";

Deno.serve(() =>
  Response.json({
    engineVersion: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    games: Object.fromEntries(Object.values(GAME_MODULES).map((g) => [g.id, g.rulesetVersion])),
  }),
);
