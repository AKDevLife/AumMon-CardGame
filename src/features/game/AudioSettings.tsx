import { useState } from "react";
import { StickerButton } from "../../components/StickerButton.tsx";
import { isMusicOn, setMusicOn } from "./music.ts";
import { isMuted, setMuted } from "./sound.ts";

/** Sound effects + background music switches (home and in-game ⚙️ settings). */
export function AudioSettings() {
  const [muted, setMutedState] = useState(isMuted);
  const [music, setMusic] = useState(isMusicOn);
  return (
    <div className="flex flex-col gap-2">
      <StickerButton
        aria-pressed={!muted}
        onClick={() => {
          setMutedState(!muted);
          setMuted(!muted);
        }}
      >
        {muted ? "🔇 เสียงเอฟเฟกต์: ปิด" : "🔊 เสียงเอฟเฟกต์: เปิด"}
      </StickerButton>
      <StickerButton
        aria-pressed={music}
        onClick={() => {
          setMusic(!music);
          setMusicOn(!music);
        }}
      >
        {music ? "🎵 เพลงพื้นหลัง: เปิด" : "🔕 เพลงพื้นหลัง: ปิด"}
      </StickerButton>
    </div>
  );
}
