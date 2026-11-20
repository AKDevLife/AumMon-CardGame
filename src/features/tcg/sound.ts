import type { v2 } from "@aummon/game-engine";

/**
 * Small synthesized sound effects (Web Audio, no asset files). Browsers only allow audio
 * after a user gesture, so the context is created lazily and failures are ignored.
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

function play(notes: Note[]): void {
  if (isMuted() || typeof window === "undefined" || !("AudioContext" in window)) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? "triangle";
      osc.frequency.setValueAtTime(n.f, now + n.t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, now + n.t + n.d);
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.exponentialRampToValueAtTime((n.v ?? 0.18) * VOLUME, now + n.t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  } catch {
    // Audio is a nice-to-have; never break the game over it.
  }
}

export const SOUNDS = {
  summon: [
    { f: 330, to: 660, t: 0, d: 0.12 },
    { f: 880, t: 0.1, d: 0.1 },
  ],
  attack: [
    { f: 180, to: 60, t: 0, d: 0.18, type: "sawtooth", v: 0.2 },
    { f: 1200, to: 300, t: 0, d: 0.08, type: "square", v: 0.05 },
  ],
  destroyed: [{ f: 440, to: 110, t: 0, d: 0.35, type: "square", v: 0.12 }],
  evolve: [523, 659, 784, 1047].map((f, i) => ({ f, t: i * 0.07, d: 0.14 })),
  fuse: [392, 523, 659, 784, 1047].map((f, i) => ({
    f,
    t: i * 0.06,
    d: 0.16,
    type: "sine" as const,
  })),
  equip: [
    { f: 1400, t: 0, d: 0.05, type: "square", v: 0.08 },
    { f: 1800, t: 0.06, d: 0.05, type: "square", v: 0.08 },
  ],
  action: [{ f: 600, to: 1200, t: 0, d: 0.15, type: "sine" }],
  boost: [{ f: 300, to: 900, t: 0, d: 0.25, type: "sawtooth", v: 0.1 }],
  turn: [
    { f: 660, t: 0, d: 0.12, type: "sine" },
    { f: 990, t: 0.12, d: 0.18, type: "sine" },
  ],
  win: [523, 659, 784, 1047, 1319].map((f, i) => ({ f, t: i * 0.12, d: 0.22 })),
  lose: [440, 392, 330, 262].map((f, i) => ({ f, t: i * 0.16, d: 0.25, type: "sine" as const })),
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof SOUNDS;

/** Which sound a public game event makes (null = silent). `mySeat` decides win/lose and turn chime. */
export function soundFor(e: v2.GameEvent, mySeat: v2.Seat | null): SoundName | null {
  switch (e.type) {
    case "unit_summoned":
      return "summon";
    case "attacked":
      return "attack";
    case "unit_destroyed":
      return "destroyed";
    case "unit_evolved":
      return "evolve";
    case "unit_fused":
      return "fuse";
    case "equipment_attached":
      return "equip";
    case "action_played":
      return "action";
    case "boosted":
      return "boost";
    case "turn_started":
      return e.seat === mySeat ? "turn" : null;
    case "match_ended":
      if (mySeat === null || "draw" in e.result) return "win";
      return e.result.winner === mySeat ? "win" : "lose";
    default:
      return null;
  }
}

export function playSound(name: SoundName): void {
  play(SOUNDS[name]);
}
