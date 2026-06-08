import type { Rng } from "../rng/rng";
import type { Item } from "./item";
import { ITEM_BASES } from "./item-bases";
import { rollRarity } from "./roll-rarity";
import { baseValueForLevel } from "./level-curve";
import { scaleItem } from "./scale-item";

export interface GenerateOptions {
  readonly itemLevel: number;
}

/**
 * Generates a deterministic, procedurally scaled equippable Item.
 *
 * Algorithm (linear and intentional):
 *  1. Filter ITEM_BASES to those with minLevel <= itemLevel.
 *  2. Pick one base uniformly via rng.
 *  3. Roll rarity via rollRarity(rng).
 *  4. Roll one modifier attribute from base.rollableAttributes via rng.
 *     (TODO: roll affix count by rarity in a future milestone)
 *  5. Compute Common-baseline modifier value via baseValueForLevel(itemLevel).
 *  6. Construct a Common-magnitude Item.
 *  7. Set levelReq = base.minLevel.
 *  8. Return scaleItem(item) — rarity multiplier applied here, not earlier.
 *
 * Never calls Math.random(). All randomness is injected through `rng`.
 */
export function generateItem(rng: Rng, opts: GenerateOptions): Item {
  const { itemLevel } = opts;

  // 1. Eligible bases
  const eligible = ITEM_BASES.filter((b) => b.minLevel <= itemLevel);

  // 2. Pick base uniformly
  const base = eligible[rng.nextInt(0, eligible.length - 1)];

  // 3. Roll rarity
  const rarity = rollRarity(rng);

  // 4. Roll one modifier attribute
  const attribute =
    base.rollableAttributes[rng.nextInt(0, base.rollableAttributes.length - 1)];

  // 5. Compute Common baseline value
  const baseValue = baseValueForLevel(itemLevel);

  // 6 & 7. Build Common-magnitude Item (scaleItem multiplies value later)
  const idSuffix = rng.nextInt(100000, 999999);
  const item: Item = {
    id: `${base.id}-${idSuffix}`,
    name: base.name,
    kind: "equippable",
    rarity,
    levelReq: base.minLevel,
    slot: base.slot,
    modifiers: [{ attribute, kind: "flat", value: baseValue }],
  };

  // 8. Apply rarity scaling
  return scaleItem(item);
}
