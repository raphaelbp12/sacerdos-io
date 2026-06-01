/**
 * Maps an item level to a base (Common, 1×) modifier value.
 *
 * Formula: floor(BASE + level * PER_LEVEL)
 *
 * Where:
 *   BASE     = 2   (offset so level 1 starts at 5, not 3)
 *   PER_LEVEL = 3  (value increase per level)
 *
 * Anchor points:
 *   level  1 →  5
 *   level  5 → 17
 *   level 10 → 32
 *
 * This is the pre-rarity magnitude. scaleItem() applies the rarity
 * multiplier on top (Common 1×, Uncommon 2×, … Legendary 5×).
 * Tune BASE and PER_LEVEL here — one edit changes the whole curve.
 */

const BASE = 2;
const PER_LEVEL = 3;

export function baseValueForLevel(level: number): number {
  return Math.floor(BASE + level * PER_LEVEL);
}
