/** Allowed sound settings (mirrors src/features/game/sound.ts; drift test: tests/integration/sound-schema.test.ts). */
export const SOUND_EVENT_IDS = [
  "play",
  "draw",
  "ability",
  "umbrella",
  "skip",
  "reset",
  "turn",
  "win",
  "lose",
  "tap",
  "card_tap",
  "hand_open",
  "hand_close",
] as const;
export const SOUND_PRESET_IDS = [
  "pop",
  "bubble",
  "coin",
  "click",
  "thud",
  "sword",
  "laser",
  "drum",
  "explode",
  "sparkle",
  "magic",
  "whoosh",
  "powerup",
  "chime",
  "bell",
  "fanfare",
  "sad",
  "tap",
  "flip",
  "slide_up",
  "slide_down",
] as const;

export type SoundValue = Record<string, { preset: string; volume: number; enabled: boolean }>;

/** Validates an admin-submitted sound config; returns a clean copy or null when invalid. */
export function validateSoundConfig(raw: unknown): SoundValue | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const out: SoundValue = {};
  for (const id of SOUND_EVENT_IDS) {
    const v = input[id];
    if (typeof v !== "object" || v === null) return null;
    const r = v as Record<string, unknown>;
    const preset = r["preset"];
    const volume = r["volume"];
    const enabled = r["enabled"];
    if (typeof preset !== "string" || !(SOUND_PRESET_IDS as readonly string[]).includes(preset))
      return null;
    if (typeof volume !== "number" || !Number.isFinite(volume) || volume < 0 || volume > 2)
      return null;
    if (typeof enabled !== "boolean") return null;
    out[id] = { preset, volume: Math.round(volume * 100) / 100, enabled };
  }
  if (Object.keys(input).some((k) => !(SOUND_EVENT_IDS as readonly string[]).includes(k)))
    return null;
  return out;
}
