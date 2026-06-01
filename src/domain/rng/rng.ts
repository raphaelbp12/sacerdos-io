/**
 * Seam for randomness. Domain code never calls Math.random() directly.
 * Production code passes a seeded Rng; tests pass a deterministic one.
 */
export interface Rng {
  /** Returns a random integer in [min, max] (inclusive on both ends). */
  nextInt(min: number, max: number): number;
  /** Returns a random float in [0, 1). */
  nextFloat(): number;
}
