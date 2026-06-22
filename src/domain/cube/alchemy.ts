import type { Item } from "../items/item";
import type { Rarity } from "../items/rarity";
import { itemLevelOf } from "../items/item-level";

/**
 * Alchemy (M17) — melt an item into gold.
 *
 * `sellValue = ⌊ BASE_COMMON × gradeFactor(rarity) × levelFactor(itemLevel) ⌋`.
 *
 * Anchored to the overview §"selling items": **L1 Common = 10g**, **L10 Legendary = 6750g**.
 * The grade ladder is the ×3 geometric ladder mapped onto our 5 tiers, with Epic interpolated so
 * Legendary lands on the overview's 27× factor. The level factor is piecewise-linear through the
 * overview's Common anchors {1→1, 10→25, 15→88} and extrapolates past level 15.
 *
 * Per-gear-type gold weighting and the material item-type multiplier are deferred (D-030).
 */

const BASE_COMMON = 10;

const GRADE_FACTOR: Readonly<Record<Rarity, number>> = {
  Common: 1,
  Uncommon: 3,
  Rare: 9,
  Epic: 18,
  Legendary: 27,
};

/** Overview Common sell anchors as (level, factor) pairs, ascending by level. */
const LEVEL_ANCHORS: readonly (readonly [number, number])[] = [
  [1, 1],
  [10, 25],
  [15, 88],
];

/** Piecewise-linear factor through {@link LEVEL_ANCHORS}; clamped below the first, extrapolated above the last. */
function levelFactor(level: number): number {
  const first = LEVEL_ANCHORS[0];
  if (level <= first[0]) return first[1];

  for (let i = 1; i < LEVEL_ANCHORS.length; i++) {
    const [lo, loF] = LEVEL_ANCHORS[i - 1];
    const [hi, hiF] = LEVEL_ANCHORS[i];
    if (level <= hi) {
      return loF + ((level - lo) * (hiF - loF)) / (hi - lo);
    }
  }

  // Extrapolate using the slope of the final segment.
  const [lo, loF] = LEVEL_ANCHORS[LEVEL_ANCHORS.length - 2];
  const [hi, hiF] = LEVEL_ANCHORS[LEVEL_ANCHORS.length - 1];
  return hiF + ((level - hi) * (hiF - loF)) / (hi - lo);
}

/** Gold an item melts into. */
export function sellValue(item: Item): number {
  return Math.floor(
    BASE_COMMON * GRADE_FACTOR[item.rarity] * levelFactor(itemLevelOf(item)),
  );
}
