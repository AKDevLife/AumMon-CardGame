import type { CharacterDefinition, CharacterHook } from "../domain/types.ts";

/**
 * Registered character effects (blueprint §5.5). Each effectKey is bound to
 * exactly one hook; handlers are invoked by the resolver (rules/v1).
 * Adding a character = add its definition + an entry here, without changing core rules.
 */
export const CHARACTER_EFFECT_HOOKS: Readonly<Record<string, CharacterHook>> = {
  BONUS_DMG_FIRST_HIT: "onAttack",
  SWAP_CARD_ONCE: "onTurnStart",
  DISCARD_TO_DODGE: "onBeforeDamaged",
  REDUCE_DMG_1: "onBeforeDamaged",
};

export class CharacterConfigError extends Error {
  override name = "CharacterConfigError";
}

/** Rejects definitions whose effectKey is unknown or bound to a different hook. */
export function assertCharacterSupported(character: CharacterDefinition): void {
  const hook = CHARACTER_EFFECT_HOOKS[character.effectKey];
  if (!hook) {
    throw new CharacterConfigError(`No handler registered for effectKey ${character.effectKey}`);
  }
  if (hook !== character.hook) {
    throw new CharacterConfigError(
      `Character ${character.id}: effectKey ${character.effectKey} requires hook ${hook}, got ${character.hook}`,
    );
  }
  if (!Number.isInteger(character.hp) || character.hp <= 0) {
    throw new CharacterConfigError(`Character ${character.id}: hp must be a positive integer`);
  }
}
