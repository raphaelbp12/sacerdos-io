import type { Rng } from "../rng/rng";
import type { EquipmentSlot, Item, Rarity, ItemBase } from "../items";
import { ITEM_BASES, generateItem } from "../items";

/**
 * The coarse reward families a drop table weights between.
 * Derived from an item's equipment slot — never stored on the item (compute-don't-store).
 */
export type ItemCategory = "weapon" | "armor" | "accessory";

/** Maps an equipment slot to its reward category. */
export function categoryForSlot(slot: EquipmentSlot): ItemCategory {
  switch (slot) {
    case "weapon":
      return "weapon";
    case "helm":
    case "body":
    case "gloves":
    case "boots":
      return "armor";
    case "ring":
    case "amulet":
      return "accessory";
  }
}

/**
 * A drop table is **data**: weighted rarity ("grade odds") and weighted item category.
 * Weights need not sum to any particular total — `weightedPick` normalizes by their sum.
 */
export interface DropTable {
  readonly id: string;
  readonly rarityWeights: Partial<Record<Rarity, number>>;
  readonly categoryWeights: Partial<Record<ItemCategory, number>>;
}

/**
 * Picks a key with probability proportional to its weight, using a single `nextFloat`.
 * The same banding approach as `rollRarity` (DRY). Throws if no positive weight exists.
 */
export function weightedPick<T extends string>(
  weights: Partial<Record<T, number>>,
  rng: Rng,
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) {
    throw new Error("weightedPick: weights must sum to a positive number");
  }
  const roll = rng.nextFloat() * total;
  let cursor = 0;
  for (const [key, weight] of entries) {
    cursor += weight;
    if (roll < cursor) return key;
  }
  // Fallback (unreachable for a valid nextFloat in [0, 1)).
  return entries[entries.length - 1][0];
}

/** Picks a base of the given category eligible for the item level, uniformly. */
function pickBaseInCategory(
  rng: Rng,
  itemLevel: number,
  category: ItemCategory,
): ItemBase {
  const eligible = ITEM_BASES.filter(
    (b) => b.minLevel <= itemLevel && categoryForSlot(b.slot) === category,
  );
  if (eligible.length === 0) {
    throw new Error(
      `rollDrop: no base for category "${category}" at item level ${itemLevel}`,
    );
  }
  return eligible[rng.nextInt(0, eligible.length - 1)];
}

/**
 * Rolls one item from a drop table:
 *  1. roll rarity (grade odds), 2. roll category, 3. pick an eligible base of that category,
 *  4. delegate to `generateItem` with the forced base + rarity (reuse, don't duplicate).
 */
export function rollDrop(table: DropTable, rng: Rng, itemLevel: number): Item {
  const rarity = weightedPick(table.rarityWeights, rng);
  const category = weightedPick(table.categoryWeights, rng);
  const base = pickBaseInCategory(rng, itemLevel, category);
  return generateItem(rng, { itemLevel, base, rarity });
}
