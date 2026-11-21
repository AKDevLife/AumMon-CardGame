/**
 * Version identifiers stored on every match (spec §10).
 *
 * - ENGINE_VERSION must match this package's `version` in package.json
 *   (enforced by tests/architecture/engine-isolation.test.ts).
 * - RULESET_VERSION "4" is Everyday Objects Battle with free Active abilities. Any rule change that
 *   affects game results MUST bump it. Rulesets "1"–"3" are retired.
 */
export const ENGINE_VERSION = "0.4.0";
export const RULESET_VERSION = "4";
