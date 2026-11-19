/**
 * Version identifiers stored on every match (spec section 8).
 *
 * - ENGINE_VERSION must match this package's `version` in package.json
 *   (enforced by tests/architecture/engine-isolation.test.ts).
 * - RULESET_VERSION is locked to Rulebook v1. Any rule change that affects
 *   game results MUST bump this value instead of editing v1 behaviour.
 */
export const ENGINE_VERSION = "0.1.0";
export const RULESET_VERSION = "1";
