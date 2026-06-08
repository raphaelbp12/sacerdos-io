import type { Item } from "./item";
import { rarityMultiplier } from "./rarity";

/**
 * Returns a new Item whose modifier values have been multiplied by the
 * item's rarity multiplier (Common 1× … Legendary 5×).
 *
 * All other fields are preserved unchanged.
 * The original item object is never mutated.
 */
export function scaleItem(item: Item): Item {
  const mult = rarityMultiplier(item.rarity);
  return {
    ...item,
    modifiers: item.modifiers.map((m) => ({ ...m, value: m.value * mult })),
  };
}
