import type { Rng } from "./rng";

/**
 * Deterministic Rng implementation using the mulberry32 algorithm.
 *
 * mulberry32 is a small, well-known seedable PRNG.
 * Reference: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 *
 * Usage: pass a numeric seed; the same seed always produces the same sequence.
 * For production, seed from Date.now(). For tests, use a fixed integer.
 */
export class SeededRng implements Rng {
  declare private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns a random float in [0, 1) via mulberry32.
   * Advances internal state by one step.
   */
  nextFloat(): number {
    // mulberry32 step
    this.state = (this.state + 0x6d2b79f5) | 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] (inclusive on both ends).
   * Derived from nextFloat using: floor(nextFloat() * (max - min + 1)) + min.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }
}
