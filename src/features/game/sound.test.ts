import { describe, expect, it } from "vitest";
import { installAudioUnlock, installTapSounds, soundFor } from "./sound.ts";

describe("game sounds", () => {
  it("maps events to sounds", () => {
    expect(soundFor({ type: "played", seat: 1, cardIds: ["D01"], ability: false }, 0)).toBe("play");
    expect(soundFor({ type: "drew", seat: 1, count: 1 }, 0)).toBeNull();
    expect(soundFor({ type: "drew", seat: 0, count: 1 }, 0)).toBe("draw");
    expect(soundFor({ type: "game_over", winner: 1 }, 0)).toBe("lose");
    expect(soundFor({ type: "game_over", winner: 0 }, 0)).toBe("win");
    expect(soundFor({ type: "direction", direction: -1 }, 0)).toBeNull();
  });
});

import { defaultSoundConfig, normalizeSoundConfig, PRESETS, SOUND_EVENTS } from "./sound.ts";

describe("sound settings", () => {
  it("every default preset exists and the library offers many sounds", () => {
    for (const e of Object.values(SOUND_EVENTS)) expect(PRESETS[e.preset]).toBeDefined();
    expect(Object.keys(PRESETS).length).toBeGreaterThanOrEqual(15);
  });

  it("normalizes stored config and rejects bad values", () => {
    const c = normalizeSoundConfig({
      skip: { preset: "laser", volume: 1.5, enabled: false },
      play: { preset: "nope", volume: 9 },
    });
    expect(c.skip).toEqual({ preset: "laser", volume: 1.5, enabled: false });
    expect(c.play).toEqual(defaultSoundConfig().play);
    expect(normalizeSoundConfig(null)).toEqual(defaultSoundConfig());
  });
});

describe("installAudioUnlock", () => {
  it("adds and removes gesture listeners without throwing", () => {
    const cleanup = installAudioUnlock();
    expect(typeof cleanup).toBe("function");
    cleanup();
  });
});

describe("installTapSounds", () => {
  it("registers and cleans up the click listener", () => {
    const cleanup = installTapSounds();
    expect(typeof cleanup).toBe("function");
    cleanup();
  });
});
