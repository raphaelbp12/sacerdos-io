export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const RARITIES: readonly Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
];

/**
 * Returns the rarity multiplier used to scale item stats.
 * Common = 1×, Uncommon = 2×, Rare = 3×, Epic = 4×, Legendary = 5×.
 */
export function rarityMultiplier(rarity: Rarity): number {
  return RARITIES.indexOf(rarity) + 1;
}
