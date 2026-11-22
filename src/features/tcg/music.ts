import { audioContext } from "./sound.ts";

/**
 * Background music (owner 2026-11-22): a gentle synthesized loop, no audio files.
 * On by default; the player can switch it off in ⚙️ settings (stored per browser).
 * Notes are scheduled slightly ahead of time so playback stays steady.
 */
const MUSIC_KEY = "aummon.music";
const VOLUME = 0.05;
const BEAT = 0.42; // seconds per beat (~143 BPM, two notes per bar chord)

// Cheerful I–vi–IV–V loop in C major: [bass, chord tones…] per bar, and a melody line.
const BARS: readonly (readonly number[])[] = [
  [130.81, 261.63, 329.63, 392.0],
  [110.0, 220.0, 261.63, 329.63],
  [87.31, 174.61, 220.0, 261.63],
  [98.0, 196.0, 246.94, 293.66],
];
const MELODY: readonly (number | null)[] = [
  523.25,
  659.25,
  783.99,
  659.25,
  523.25,
  587.33,
  659.25,
  null,
  440.0,
  523.25,
  659.25,
  523.25,
  440.0,
  493.88,
  523.25,
  null,
  349.23,
  440.0,
  523.25,
  440.0,
  349.23,
  392.0,
  440.0,
  null,
  392.0,
  493.88,
  587.33,
  493.88,
  392.0,
  440.0,
  493.88,
  587.33,
];
const BEATS_PER_BAR = 8;

let timer: ReturnType<typeof setInterval> | null = null;
let master: GainNode | null = null;
let nextTime = 0;
let step = 0;

export function isMusicOn(): boolean {
  try {
    return localStorage.getItem(MUSIC_KEY) !== "0";
  } catch {
    return true;
  }
}

function note(c: AudioContext, out: AudioNode, f: number, t: number, d: number, v: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + d + 0.05);
}

function schedule(c: AudioContext, out: AudioNode): void {
  while (nextTime < c.currentTime + 0.6) {
    const i = step % MELODY.length;
    const bar = BARS[Math.floor(i / BEATS_PER_BAR) % BARS.length] ?? [];
    if (i % BEATS_PER_BAR === 0) {
      const [bass, ...chord] = bar;
      if (bass) note(c, out, bass, nextTime, BEAT * 4, 0.5);
      for (const f of chord) note(c, out, f, nextTime, BEAT * 3, 0.18);
    }
    if (i % BEATS_PER_BAR === 4 && bar[0]) note(c, out, bar[0], nextTime, BEAT * 3, 0.4);
    const m = MELODY[i];
    if (m) note(c, out, m, nextTime, BEAT * 0.9, 0.3);
    nextTime += BEAT;
    step += 1;
  }
}

/** Starts the loop if music is on; safe to call repeatedly (e.g. on every tap). */
export function startMusic(): void {
  if (timer !== null || !isMusicOn()) return;
  try {
    const c = audioContext();
    if (!c) return;
    master = c.createGain();
    master.gain.value = VOLUME;
    master.connect(c.destination);
    nextTime = c.currentTime + 0.1;
    const out = master;
    timer = setInterval(() => {
      schedule(c, out);
    }, 200);
    schedule(c, out);
  } catch {
    // Music is optional.
  }
}

export function stopMusic(): void {
  if (timer !== null) clearInterval(timer);
  timer = null;
  try {
    master?.disconnect();
  } catch {
    // already disconnected
  }
  master = null;
}

export function setMusicOn(on: boolean): void {
  try {
    localStorage.setItem(MUSIC_KEY, on ? "1" : "0");
  } catch {
    // Storage unavailable (private mode): the switch still works for this page.
  }
  if (on) startMusic();
  else stopMusic();
}

/** Browsers allow audio only after a user gesture: start the music on the first tap. */
export function installMusic(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const kick = (): void => {
    startMusic();
  };
  window.addEventListener("pointerdown", kick, true);
  window.addEventListener("keydown", kick, true);
  return () => {
    window.removeEventListener("pointerdown", kick, true);
    window.removeEventListener("keydown", kick, true);
    stopMusic();
  };
}
