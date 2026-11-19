// Minimal Edge Function proving the pure engine loads under Deno (task 4.1).
// Returns only public version info; no auth needed, no data access.
import { ENGINE_VERSION, RULESET_VERSION } from "@aummon/game-engine";

Deno.serve(() => Response.json({ engineVersion: ENGINE_VERSION, rulesetVersion: RULESET_VERSION }));
