import { describe, expect, it } from "vitest";
import { defaultSoundConfig, PRESETS, SOUND_EVENTS } from "../../src/features/tcg/sound.ts";
import {
  SOUND_EVENT_IDS,
  SOUND_PRESET_IDS,
  validateSoundConfig,
} from "../../supabase/functions/_shared/sound-schema.ts";

describe("server sound schema", () => {
  it("matches the client sound library", () => {
    expect([...SOUND_EVENT_IDS].sort()).toEqual(Object.keys(SOUND_EVENTS).sort());
    expect([...SOUND_PRESET_IDS].sort()).toEqual(Object.keys(PRESETS).sort());
  });

  it("accepts the default config and rejects tampering", () => {
    expect(validateSoundConfig(defaultSoundConfig())).not.toBeNull();
    const bad = { ...defaultSoundConfig(), attack: { preset: "laser", volume: 50, enabled: true } };
    expect(validateSoundConfig(bad)).toBeNull();
    expect(validateSoundConfig({ ...defaultSoundConfig(), extra: {} })).toBeNull();
    expect(
      validateSoundConfig({
        ...defaultSoundConfig(),
        win: { preset: "<script>", volume: 1, enabled: true },
      }),
    ).toBeNull();
    expect(validateSoundConfig("x")).toBeNull();
  });
});
