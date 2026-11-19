import type { CardEffect } from "../../domain/types.ts";

/** Rulebook v1 constants (aummon_game_spec.md §2, Rules 7–8, 14). */
export const RULESET_V1 = {
  minPlayers: 2,
  maxPlayers: 4,
  initialHand: 3,
  maxHand: 5,
  deckSize: 40,
  selectTimeoutMs: 30_000,
  /** Clarification Q7 (provisional). */
  aquaWindowMs: 15_000,
} as const;

/** Standard deck v1 (Rule 8; chaos split per clarification Q1). */
export const STANDARD_DECK_V1: Readonly<Record<CardEffect, number>> = {
  attack: 16,
  defense: 10,
  support: 8,
  redirect: 2,
  aoe: 2,
  disrupt: 2,
};
