import type { Item } from "./item";

/**
 * Decides whether an item stacks (many of it share a single inventory slot) or
 * consumes its own slot. Locked rule (overview): **misc items stack**; item
 * modifiers and boss keys do not.
 */
export type StackPolicy = (item: Item) => boolean;

/** Default policy: only `misc` items stack; everything else is one slot each. */
export const DEFAULT_STACK_POLICY: StackPolicy = (item) => item.kind === "misc";

/** A grouped read model of the inventory: one entry per occupied slot. */
export interface ItemStack {
  readonly id: string;
  readonly item: Item;
  readonly count: number;
}

/**
 * An owned-items list with an optional capacity (in **slots**) and a stacking
 * policy. The same abstraction backs the player inventory and every stash tab
 * (overview: reuse one class). Slots are **computed, not stored**: stackable
 * items of the same id share one slot; every other item takes its own.
 *
 * Structurally satisfies the loot module's `LootSink` (`hasSpace()` + `add`)
 * without importing it (one-way deps: `loot → items`, never the reverse).
 */
export class Inventory {
  private readonly _items: Item[] = [];
  declare private readonly _capacity: number;
  declare private readonly _stackPolicy: StackPolicy;

  constructor(
    capacity: number = Infinity,
    stackPolicy: StackPolicy = DEFAULT_STACK_POLICY,
  ) {
    if (
      capacity !== Infinity &&
      (!Number.isInteger(capacity) || capacity < 0)
    ) {
      throw new Error(
        "Inventory: capacity must be a non-negative integer or Infinity",
      );
    }
    this._capacity = capacity;
    this._stackPolicy = stackPolicy;
  }

  get items(): readonly Item[] {
    return this._items;
  }

  get capacity(): number {
    return this._capacity;
  }

  /** Slots occupied: one per distinct stackable id + one per non-stackable item. */
  get slotsUsed(): number {
    return this.stacks.length;
  }

  /** A grouped view: one `ItemStack` per occupied slot, in first-seen order. */
  get stacks(): readonly ItemStack[] {
    const stacks: { id: string; item: Item; count: number }[] = [];
    const stackIndexById = new Map<string, number>();
    for (const item of this._items) {
      if (this._stackPolicy(item)) {
        const idx = stackIndexById.get(item.id);
        if (idx !== undefined) {
          stacks[idx].count++;
          continue;
        }
        stackIndexById.set(item.id, stacks.length);
      }
      stacks.push({ id: item.id, item, count: 1 });
    }
    return stacks;
  }

  get isFull(): boolean {
    return this.slotsUsed >= this._capacity;
  }

  /** Item-agnostic space check (the `LootSink` contract): is a free slot available? */
  hasSpace(): boolean {
    return this.slotsUsed < this._capacity;
  }

  /**
   * Item-aware space check: true when a stackable item can join an existing
   * same-id stack (even if otherwise full) or when a free slot exists.
   */
  canAccept(item: Item): boolean {
    if (this._stackPolicy(item) && this._items.some((i) => i.id === item.id)) {
      return true;
    }
    return this.hasSpace();
  }

  /** Adds an item. Returns false (storing nothing) when there is no room. */
  add(item: Item): boolean {
    if (!this.canAccept(item)) return false;
    this._items.push(item);
    return true;
  }

  /** Removes the item by reference. Returns true if found and removed, false otherwise. */
  remove(item: Item): boolean {
    const idx = this._items.indexOf(item);
    if (idx === -1) return false;
    this._items.splice(idx, 1);
    return true;
  }
}
