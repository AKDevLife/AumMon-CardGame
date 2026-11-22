/**
 * Version identifiers stored on every match (spec §10).
 *
 * - ENGINE_VERSION must match this package's `version` in package.json
 *   (enforced by tests/architecture/engine-isolation.test.ts).
 * - RULESET_VERSION "6" is Everyday Objects Battle (free Actives, any action order, Guard works while asleep, second-player compensation). Any rule change that
 *   affects game results MUST bump it. Rulesets "1"–"5" are retired.
 */
export const ENGINE_VERSION = "0.6.0";
export const RULESET_VERSION = "6";
