import { describe, expect, it } from "vitest";
import { installMusic, isMusicOn, setMusicOn } from "./music.ts";

describe("background music", () => {
  it("is on by default and the setting is remembered", () => {
    localStorage.removeItem("aummon.music");
    expect(isMusicOn()).toBe(true);
    setMusicOn(false);
    expect(isMusicOn()).toBe(false);
    setMusicOn(true);
    expect(isMusicOn()).toBe(true);
    installMusic()();
  });
});
