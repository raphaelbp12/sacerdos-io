import type { Rng } from "../rng/rng";
import type { Item } from "../items";
import { ITEM_BASES, generateItem } from "../items";
import type { DropTable } from "./drop-table";
import { rollDrop } from "./drop-table";

/** The three chest grades, each tied to a progressively richer drop table. */
export type ChestTier = "common" | "rare" | "legendary";

/**
 * A stored, unopened chest.
 *
 * When `guaranteedBaseId` is set, opening always yields that exact base at Common rarity —
 * this models the overview's **100% first drop** (a class weapon).
 */
export interface Chest {
  readonly tier: ChestTier;
  readonly guaranteedBaseId?: string;
}

/**
 * Common chest — carries the overview's first-chest grade odds.
 * (Per-source drop chances and the first-chest 16% gate are balance, deferred — D-005.)
 */
export const COMMON_CHEST_TABLE: DropTable = {
  id: "common-chest",
  rarityWeights: { Common: 78, Uncommon: 20.6, Rare: 1.37 },
  categoryWeights: { weapon: 25, armor: 31 },
};

/** Rare chest — shifts the grade odds up a tier (placeholder, D-005). */
export const RARE_CHEST_TABLE: DropTable = {
  id: "rare-chest",
  rarityWeights: { Uncommon: 50, Rare: 35, Epic: 13, Legendary: 2 },
  categoryWeights: { weapon: 30, armor: 50, accessory: 20 },
};

/** Legendary chest — best grade odds (placeholder, D-005). */
export const LEGENDARY_CHEST_TABLE: DropTable = {
  id: "legendary-chest",
  rarityWeights: { Rare: 40, Epic: 40, Legendary: 20 },
  categoryWeights: { weapon: 30, armor: 50, accessory: 20 },
};

/** The drop table each chest tier rolls from. */
export const DROP_TABLES: Record<ChestTier, DropTable> = {
  common: COMMON_CHEST_TABLE,
  rare: RARE_CHEST_TABLE,
  legendary: LEGENDARY_CHEST_TABLE,
};

/**
 * Builds the player's very first chest: a common chest whose drop is a guaranteed
 * class weapon (100% first drop). `classWeaponBaseId` is the class's starter weapon
 * base id (e.g. `"short-sword"` for the Knight).
 */
export function firstChest(classWeaponBaseId: string): Chest {
  return { tier: "common", guaranteedBaseId: classWeaponBaseId };
}

/**
 * Opens a chest, producing exactly one item.
 *  - A guaranteed-base chest yields that base at Common rarity.
 *  - Otherwise the chest rolls its tier's drop table via the injected `Rng`.
 */
export function openChest(chest: Chest, rng: Rng, itemLevel: number): Item {
  if (chest.guaranteedBaseId !== undefined) {
    const base = ITEM_BASES.find((b) => b.id === chest.guaranteedBaseId);
    if (!base) {
      throw new Error(`openChest: unknown base id "${chest.guaranteedBaseId}"`);
    }
    return generateItem(rng, { itemLevel, base, rarity: "Common" });
  }
  return rollDrop(DROP_TABLES[chest.tier], rng, itemLevel);
}
