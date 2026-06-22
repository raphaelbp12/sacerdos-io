import type { Item } from "./item";

/**
 * The item level an item rolled at, falling back to its equip-level requirement
 * when a hand-authored item carries no explicit `itemLevel`. The single accessor
 * the cube (thresholds, sell value, EXP) reads instead of touching `itemLevel` directly.
 */
export function itemLevelOf(item: Item): number {
  return item.itemLevel ?? item.levelReq;
}
