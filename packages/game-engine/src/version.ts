/**
 * Version identifiers stored on every match (spec §10).
 *
 * - ENGINE_VERSION must match this package's `version` in package.json
 *   (enforced by tests/architecture/engine-isolation.test.ts).
 * - RULESET_VERSION is the 1v1 TCG (Core Rules V1.1). Any rule change that
 *   affects game results MUST bump it. Ruleset "1" (2–4 players) is retired.
 */
export const ENGINE_VERSION = "0.3.0";
export const RULESET_VERSION = "2";
