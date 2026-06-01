import type { Rng } from "../rng/rng";
import type { Rarity } from "./rarity";
import { RARITIES } from "./rarity";

/**
 * Weight table for rarity selection.
 * Higher weight = more common. Total = 100 for easy percentage reading.
 * Tune these values here — one change updates the whole game's loot curve.
 */
const RARITY_WEIGHTS: Record<Rarity, number> = {
  Common: 50,
  Uncommon: 25,
  Rare: 15,
  Epic: 7,
  Legendary: 3,
};

const TOTAL_WEIGHT = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * Rolls a Rarity using the injected Rng, weighted so that Common is most
 * frequent and Legendary is rarest.
 *
 * Uses a single nextFloat() call to pick a band in [0, TOTAL_WEIGHT).
 */
export function rollRarity(rng: Rng): Rarity {
  const roll = rng.nextFloat() * TOTAL_WEIGHT;
  let cursor = 0;
  for (const rarity of RARITIES) {
    cursor += RARITY_WEIGHTS[rarity];
    if (roll < cursor) {
      return rarity;
    }
  }
  // Fallback (should be unreachable given a valid nextFloat in [0, 1))
  return RARITIES[RARITIES.length - 1];
}
