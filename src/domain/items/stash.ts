import type { Item } from "./item";
import { Inventory, type StackPolicy } from "./inventory";

/**
 * The player's stash: an ordered set of `Inventory` tabs (overview: "reuse the
 * inventory class"). Starts with 1 tab; more tabs and bigger capacities are
 * bought later from the rune tree (M18). Movement between the inventory and any
 * tab is handled by the free `moveItem` function below.
 */
export class Stash {
  declare private readonly _tabs: Inventory[];

  constructor(
    tabCount: number,
    capacityPerTab: number,
    stackPolicy?: StackPolicy,
  ) {
    if (!Number.isInteger(tabCount) || tabCount < 1) {
      throw new Error("Stash: tabCount must be a positive integer");
    }
    this._tabs = Array.from(
      { length: tabCount },
      () => new Inventory(capacityPerTab, stackPolicy),
    );
  }

  get tabs(): readonly Inventory[] {
    return this._tabs;
  }
}

/**
 * Moves `item` from one inventory to another (inventory ↔ stash tab, or tab ↔
 * tab). Atomic: the destination is verified with `canAccept` **before** the
 * source is mutated, so a rejected move leaves both sides untouched. Returns
 * false when the destination has no room or the source does not hold the item.
 */
export function moveItem(from: Inventory, to: Inventory, item: Item): boolean {
  if (!to.canAccept(item)) return false;
  if (!from.remove(item)) return false;
  to.add(item);
  return true;
}
