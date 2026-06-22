import type { Item } from "../../domain/items";
import type { Modifier } from "../../domain/stats";

/** Render one modifier the way the overview reads it (flat vs percent). */
export function formatModifier(m: Modifier): string {
  return m.kind === "flat"
    ? `+${m.value} ${m.attribute}`
    : `+${Math.round(m.value * 100)}% ${m.attribute}`;
}

/** Join an item's passive modifiers into a single line. */
export function formatModifiers(item: Item): string {
  return item.modifiers.map(formatModifier).join(", ");
}

/** Lowercase rarity for the `--rarity-<key>` modifier classes. */
export function rarityKey(rarity: string): string {
  return rarity.toLowerCase();
}
