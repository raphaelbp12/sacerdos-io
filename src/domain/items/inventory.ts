import type { Item } from "./item";

/**
 * Simplest possible owned-items list.
 * Backed by an Inventory class so sorting/filtering/stacks can be added later
 * without touching callers.
 */
export class Inventory {
  private readonly _items: Item[] = [];

  get items(): readonly Item[] {
    return this._items;
  }

  add(item: Item): void {
    this._items.push(item);
  }

  /** Removes the item by reference. Returns true if found and removed, false otherwise. */
  remove(item: Item): boolean {
    const idx = this._items.indexOf(item);
    if (idx === -1) return false;
    this._items.splice(idx, 1);
    return true;
  }
}
