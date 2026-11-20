/** Injected randomness: the engine never calls Math.random. */
export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

/** Serializable PRNG state (stored server-side in private.match_runtime.rng_state). */
export type RngState = [number, number, number, number];

export interface SeededRandom extends RandomSource {
  /** Snapshot for persistence/replay. */
  getState(): RngState;
}

const rotl = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0;

/**
 * xoshiro128** — small, fast, deterministic. Seed it from a CSPRNG in the
 * adapter layer; never from user input. Not used for anything cryptographic.
 */
export function createSeededRandom(seed: RngState): SeededRandom {
  if (seed.every((v) => v === 0)) throw new Error("RNG seed must not be all zeros");
  const s: RngState = [seed[0] >>> 0, seed[1] >>> 0, seed[2] >>> 0, seed[3] >>> 0];

  const nextUint32 = (): number => {
    const result = Math.imul(rotl(Math.imul(s[1], 5) >>> 0, 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotl(s[3], 11);
    return result;
  };

  return {
    nextInt(maxExclusive: number): number {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x1_0000_0000) {
        throw new RangeError(`nextInt bound must be an integer in 1..2^32, got ${maxExclusive}`);
      }
      // Rejection sampling: unbiased.
      const limit = 0x1_0000_0000 - (0x1_0000_0000 % maxExclusive);
      for (;;) {
        const value = nextUint32();
        if (value < limit) return value % maxExclusive;
      }
    },
    getState: () => [s[0], s[1], s[2], s[3]],
  };
}
