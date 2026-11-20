import { describe, expect, it } from "vitest";
import { soundFor } from "./sound.ts";

describe("game sounds", () => {
  it("maps events to sounds", () => {
    expect(
      soundFor(
        {
          type: "unit_summoned",
          seat: 0,
          instanceId: "x",
          cardId: "U001_RUBBER_DUCKLING",
          exhausted: true,
        },
        0,
      ),
    ).toBe("summon");
    expect(soundFor({ type: "turn_started", seat: 1, turn: 2, spark: 1 }, 0)).toBeNull();
    expect(soundFor({ type: "turn_started", seat: 0, turn: 3, spark: 2 }, 0)).toBe("turn");
    expect(soundFor({ type: "match_ended", result: { winner: 1 } }, 0)).toBe("lose");
    expect(soundFor({ type: "match_ended", result: { winner: 0 } }, 0)).toBe("win");
    expect(soundFor({ type: "card_drawn", seat: 0, instanceId: "x" }, 0)).toBeNull();
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
      attack: { preset: "laser", volume: 1.5, enabled: false },
      summon: { preset: "nope", volume: 9 },
    });
    expect(c.attack).toEqual({ preset: "laser", volume: 1.5, enabled: false });
    expect(c.summon).toEqual(defaultSoundConfig().summon);
    expect(normalizeSoundConfig(null)).toEqual(defaultSoundConfig());
  });
});
