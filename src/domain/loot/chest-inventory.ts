import type { Rng } from "../rng/rng";
import type { Item } from "../items";
import type { Chest } from "./chest-def";
import { openChest } from "./chest-def";

/**
 * Where an opened chest's item goes. A minimal contract so the chest store stays
 * decoupled from the concrete `Inventory` (whose real capacity arrives in M15).
 */
export interface LootSink {
  /** True when the sink can accept at least one more item. */
  hasSpace(): boolean;
  add(item: Item): void;
}

/**
 * A capacity-capped store of unopened chests. Once full, further chests are rejected
 * (the overview: chests are a limited, accumulable resource). Opening a chest requires
 * space in the target `LootSink`.
 */
export class ChestInventory {
  private readonly _capacity: number;
  private readonly _chests: Chest[] = [];

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new Error(
        "ChestInventory: capacity must be a non-negative integer",
      );
    }
    this._capacity = capacity;
  }

  get capacity(): number {
    return this._capacity;
  }

  get count(): number {
    return this._chests.length;
  }

  get chests(): readonly Chest[] {
    return this._chests;
  }

  get isFull(): boolean {
    return this._chests.length >= this._capacity;
  }

  /** Adds a chest. Returns false (without storing) when the store is full. */
  add(chest: Chest): boolean {
    if (this.isFull) return false;
    this._chests.push(chest);
    return true;
  }

  /**
   * Opens the chest at `index`, routing its rolled item into `sink`.
   * Throws on an out-of-range index or when the sink has no space; on success the
   * chest is removed and the produced item is returned.
   */
  open(index: number, sink: LootSink, rng: Rng, itemLevel: number): Item {
    if (index < 0 || index >= this._chests.length) {
      throw new RangeError(`ChestInventory.open: index ${index} out of range`);
    }
    if (!sink.hasSpace()) {
      throw new Error("ChestInventory.open: inventory is full");
    }
    const chest = this._chests[index];
    const item = openChest(chest, rng, itemLevel);
    sink.add(item);
    this._chests.splice(index, 1);
    return item;
  }
}
