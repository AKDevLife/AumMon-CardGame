import type { v6 } from "@aummon/game-engine";

/**
 * Synthesized sound effects (Web Audio, no asset files). Each game event plays a preset
 * from the library; admins choose preset/volume/on-off per event (stored server-side in
 * public.game_settings 'sounds', read by every player). Failures never break the game.
 */
interface Note {
  f: number;
  t: number;
  d: number;
  type?: OscillatorType;
  to?: number;
  v?: number;
}

const MUTE_KEY = "aummon.muted";
/** Master loudness (owner 2026-11-20: +50%). */
const VOLUME = 1.5;
let ctx: AudioContext | null = null;

const arp = (fs: number[], step: number, d: number, type: OscillatorType = "triangle"): Note[] =>
  fs.map((f, i) => ({ f, t: i * step, d, type }));

/** Sound library (Thai labels for the admin picker). */
export const PRESETS = {
  pop: {
    label: "ป๊อป",
    notes: [
      { f: 330, to: 660, t: 0, d: 0.12 },
      { f: 880, t: 0.1, d: 0.1 },
    ],
  },
  bubble: {
    label: "ฟองสบู่",
    notes: [
      { f: 400, to: 1200, t: 0, d: 0.1, type: "sine" },
      { f: 600, to: 1500, t: 0.08, d: 0.1, type: "sine" },
    ],
  },
  coin: {
    label: "เหรียญ",
    notes: [
      { f: 988, t: 0, d: 0.08, type: "square", v: 0.1 },
      { f: 1319, t: 0.08, d: 0.25, type: "square", v: 0.1 },
    ],
  },
  click: {
    label: "คลิก",
    notes: [
      { f: 1400, t: 0, d: 0.05, type: "square", v: 0.08 },
      { f: 1800, t: 0.06, d: 0.05, type: "square", v: 0.08 },
    ],
  },
  thud: {
    label: "ตุ๊บ",
    notes: [
      { f: 180, to: 60, t: 0, d: 0.18, type: "sawtooth", v: 0.2 },
      { f: 1200, to: 300, t: 0, d: 0.08, type: "square", v: 0.05 },
    ],
  },
  sword: {
    label: "ฟันดาบ",
    notes: [
      { f: 2000, to: 400, t: 0, d: 0.12, type: "sawtooth", v: 0.1 },
      { f: 300, to: 120, t: 0.08, d: 0.15, type: "square", v: 0.12 },
    ],
  },
  laser: { label: "เลเซอร์", notes: [{ f: 1600, to: 200, t: 0, d: 0.22, type: "square", v: 0.1 }] },
  drum: {
    label: "กลอง",
    notes: [
      { f: 120, to: 50, t: 0, d: 0.2, type: "sine", v: 0.3 },
      { f: 120, to: 50, t: 0.15, d: 0.2, type: "sine", v: 0.3 },
    ],
  },
  explode: {
    label: "ระเบิด",
    notes: [
      { f: 440, to: 110, t: 0, d: 0.35, type: "square", v: 0.12 },
      { f: 90, to: 40, t: 0.05, d: 0.4, type: "sawtooth", v: 0.15 },
    ],
  },
  sparkle: { label: "วิบวับ", notes: arp([523, 659, 784, 1047], 0.07, 0.14) },
  magic: { label: "เวทมนตร์", notes: arp([392, 523, 659, 784, 1047], 0.06, 0.16, "sine") },
  whoosh: { label: "วูช", notes: [{ f: 600, to: 1200, t: 0, d: 0.15, type: "sine" }] },
  powerup: {
    label: "พลังขึ้น",
    notes: [{ f: 300, to: 900, t: 0, d: 0.25, type: "sawtooth", v: 0.1 }],
  },
  chime: {
    label: "กระดิ่ง",
    notes: [
      { f: 660, t: 0, d: 0.12, type: "sine" },
      { f: 990, t: 0.12, d: 0.18, type: "sine" },
    ],
  },
  bell: {
    label: "ระฆัง",
    notes: [
      { f: 880, t: 0, d: 0.6, type: "sine" },
      { f: 1760, t: 0, d: 0.4, type: "sine", v: 0.06 },
    ],
  },
  fanfare: { label: "แฟนแฟร์", notes: arp([523, 659, 784, 1047, 1319], 0.12, 0.22) },
  tap: { label: "แตะเบาๆ", notes: [{ f: 900, to: 700, t: 0, d: 0.05, type: "sine", v: 0.12 }] },
  flip: {
    label: "พลิกการ์ด",
    notes: [
      { f: 500, to: 1100, t: 0, d: 0.07, type: "triangle", v: 0.12 },
      { f: 1300, t: 0.06, d: 0.06, type: "sine", v: 0.08 },
    ],
  },
  slide_up: {
    label: "เลื่อนขึ้น",
    notes: [{ f: 350, to: 900, t: 0, d: 0.16, type: "sine", v: 0.14 }],
  },
  slide_down: {
    label: "เลื่อนลง",
    notes: [{ f: 900, to: 350, t: 0, d: 0.16, type: "sine", v: 0.14 }],
  },
  sad: { label: "เศร้า", notes: arp([440, 392, 330, 262], 0.16, 0.25, "sine") },
} satisfies Record<string, { label: string; notes: Note[] }>;
export type PresetId = keyof typeof PRESETS;

/** Game moments that can make a sound, with the default preset. */
export const SOUND_EVENTS = {
  summon: { label: "ลงการ์ดตัวละคร", preset: "pop" },
  attack: { label: "โจมตี", preset: "thud" },
  destroyed: { label: "ตัวละครถูกทำลาย", preset: "explode" },
  ability: { label: "ใช้ความสามารถ (กดใช้เอง)", preset: "magic" },
  passive: { label: "ความสามารถทำงานเอง", preset: "sparkle" },
  turn: { label: "เริ่มเทิร์นของคุณ", preset: "chime" },
  win: { label: "ชนะ", preset: "fanfare" },
  tap: { label: "กดปุ่มทั่วไป", preset: "tap" },
  card_tap: { label: "แตะการ์ด", preset: "flip" },
  hand_open: { label: "เปิดการ์ดในมือ", preset: "slide_up" },
  hand_close: { label: "พับการ์ดในมือ", preset: "slide_down" },
  lose: { label: "แพ้", preset: "sad" },
} satisfies Record<string, { label: string; preset: PresetId }>;
export type SoundEvent = keyof typeof SOUND_EVENTS;

export interface SoundSetting {
  preset: PresetId;
  /** 0–2 (1 = normal). */
  volume: number;
  enabled: boolean;
}
export type SoundConfig = Record<SoundEvent, SoundSetting>;

export const defaultSoundConfig = (): SoundConfig =>
  Object.fromEntries(
    (Object.keys(SOUND_EVENTS) as SoundEvent[]).map((e) => [
      e,
      { preset: SOUND_EVENTS[e].preset, volume: 1, enabled: true },
    ]),
  ) as SoundConfig;

/** Merges a stored config over defaults; unknown/invalid values fall back to defaults. */
export function normalizeSoundConfig(raw: unknown): SoundConfig {
  const out = defaultSoundConfig();
  if (typeof raw !== "object" || raw === null) return out;
  for (const e of Object.keys(out) as SoundEvent[]) {
    const v = (raw as Record<string, unknown>)[e];
    if (typeof v !== "object" || v === null) continue;
    const r = v as Record<string, unknown>;
    if (typeof r["preset"] === "string" && r["preset"] in PRESETS)
      out[e].preset = r["preset"] as PresetId;
    if (typeof r["volume"] === "number" && r["volume"] >= 0 && r["volume"] <= 2)
      out[e].volume = r["volume"];
    if (typeof r["enabled"] === "boolean") out[e].enabled = r["enabled"];
  }
  return out;
}

let config: SoundConfig = defaultSoundConfig();
export const setSoundConfig = (c: SoundConfig): void => {
  config = c;
};

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Storage unavailable (private mode): the toggle still works for this page.
  }
}

/**
 * Browsers (iOS Safari especially) only let audio start inside a user gesture, and
 * suspend/"interrupt" it after backgrounding. Game sounds play from server responses
 * (bot steps, polls), not from taps, so unlock/resume audio on every tap instead.
 */
function wake(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state !== "running") void ctx.resume().catch(() => undefined);
  return ctx;
}

export function installAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const unlock = (): void => {
    try {
      const c = wake();
      if (!c) return;
      // A silent one-sample buffer completes the unlock on iOS.
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start();
    } catch {
      // Audio is optional.
    }
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  return () => {
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };
}

function play(notes: Note[], volume: number): void {
  if (volume <= 0) return;
  try {
    const ctx = wake();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? "triangle";
      osc.frequency.setValueAtTime(n.f, now + n.t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, now + n.t + n.d);
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, (n.v ?? 0.18) * VOLUME * volume),
        now + n.t + 0.01,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  } catch {
    // Audio is a nice-to-have; never break the game over it.
  }
}

/** Preview a preset regardless of the player's mute switch (admin picker). */
export const previewPreset = (preset: PresetId, volume = 1): void => {
  play(PRESETS[preset].notes, volume);
};

/** Which sound a public game event makes (null = silent). `mySeat` decides win/lose and turn chime. */
export function soundFor(e: v6.GameEvent, mySeat: v6.Seat | null): SoundEvent | null {
  switch (e.type) {
    case "unit_summoned":
      return "summon";
    case "attacked":
      return "attack";
    case "unit_destroyed":
      return "destroyed";
    case "ability_activated":
      return "ability";
    case "ability_triggered":
      return "passive";
    case "turn_started":
      return e.seat === mySeat ? "turn" : null;
    case "match_ended":
      if (mySeat === null || "draw" in e.result) return "win";
      return e.result.winner === mySeat ? "win" : "lose";
    default:
      return null;
  }
}

/**
 * Tap sound for any button on the game screen: `data-sound` picks a special one, else "tap".
 * The sound is chosen in the capture phase (before React re-renders the button, e.g. the
 * drawer's open/close label) and played in the bubble phase unless a drag cancelled the click.
 */
export function installTapSounds(): () => void {
  if (typeof document === "undefined") return () => undefined;
  let chosen: SoundEvent | null = null;
  const pick = (e: MouseEvent): void => {
    chosen = null;
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest("button, [role=button], a[href], input, select, summary");
    if (!el || el.matches(":disabled")) return;
    const special = el.closest("[data-sound]")?.getAttribute("data-sound");
    chosen = special && special in SOUND_EVENTS ? (special as SoundEvent) : "tap";
  };
  const fire = (e: MouseEvent): void => {
    if (chosen && !e.defaultPrevented) playSound(chosen);
    chosen = null;
  };
  document.addEventListener("click", pick, true);
  document.addEventListener("click", fire);
  return () => {
    document.removeEventListener("click", pick, true);
    document.removeEventListener("click", fire);
  };
}

export function playSound(event: SoundEvent): void {
  const s = config[event];
  if (isMuted() || !s.enabled) return;
  play(PRESETS[s.preset].notes, s.volume);
}
