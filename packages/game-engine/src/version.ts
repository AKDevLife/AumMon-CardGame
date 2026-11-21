/**
 * Version identifiers stored on every match (spec §10).
 *
 * - ENGINE_VERSION must match this package's `version` in package.json
 *   (enforced by tests/architecture/engine-isolation.test.ts).
 * - RULESET_VERSION "3" is Everyday Objects Battle (Object cards + abilities). Any rule change that
 *   affects game results MUST bump it. Rulesets "1" and "2" are retired.
 */
export const ENGINE_VERSION = "0.3.0";
export const RULESET_VERSION = "3";
