/**
 * Version identifiers stored on every match.
 *
 * - ENGINE_VERSION must match this package's `version` in package.json
 *   (enforced by tests/architecture/engine-isolation.test.ts). 1.0.0 = first engine of the
 *   Casual Discard Edition (the earlier 1v1 card games were removed in task 12.4).
 * - RULESET_VERSION identifies the game rules stored with each match ("12" = owner card changes 2026-11-22 (Flashlight, Magnifier, Fan / Alarm swap); "11" retired; "8" = first Quick Match, retired; earlier:
 *   Edition Quick Match, docs/discard/AumMon_Core_Rules.md; "7" = first Discard Edition, retired). Any rule change that affects results MUST bump it.
 */
export const ENGINE_VERSION = "6.0.0";
export const RULESET_VERSION = "12";
