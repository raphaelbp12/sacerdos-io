import { describe, it, expect } from "vitest";
import { SeededRng } from "../rng/seeded-rng";
import type { Item } from "../items";
import { ChestInventory, type LootSink } from "./chest-inventory";
import { firstChest, type Chest } from "./chest-def";

/** A test sink with a fixed capacity, standing in for M15's capped inventory. */
class FakeSink implements LootSink {
  private readonly _capacity: number;
  readonly items: Item[] = [];

  constructor(capacity: number) {
    this._capacity = capacity;
  }

  hasSpace(): boolean {
    return this.items.length < this._capacity;
  }

  add(item: Item): void {
    this.items.push(item);
  }
}

describe("ChestInventory", () => {
  it("rejects a negative or non-integer capacity", () => {
    expect(() => new ChestInventory(-1)).toThrow();
    expect(() => new ChestInventory(1.5)).toThrow();
  });

  it("accepts chests up to capacity, then rejects further chests", () => {
    const store = new ChestInventory(2);
    expect(store.add({ tier: "common" })).toBe(true);
    expect(store.add({ tier: "common" })).toBe(true);
    expect(store.isFull).toBe(true);
    expect(store.add({ tier: "common" })).toBe(false);
    expect(store.count).toBe(2);
  });

  it("open routes the rolled item into the sink and removes the chest", () => {
    const store = new ChestInventory(4);
    store.add(firstChest("short-sword"));
    const sink = new FakeSink(10);

    const item = store.open(0, sink, new SeededRng(1), 5);

    expect(item.name).toBe("Short Sword");
    expect(sink.items).toContain(item);
    expect(store.count).toBe(0);
  });

  it("open is blocked when the sink has no space", () => {
    const store = new ChestInventory(4);
    const chest: Chest = { tier: "common" };
    store.add(chest);
    const fullSink = new FakeSink(0);

    expect(() => store.open(0, fullSink, new SeededRng(1), 5)).toThrow();
    // The chest is kept when opening is blocked.
    expect(store.count).toBe(1);
  });

  it("open throws on an out-of-range index", () => {
    const store = new ChestInventory(4);
    store.add({ tier: "common" });
    const sink = new FakeSink(10);
    expect(() => store.open(5, sink, new SeededRng(1), 5)).toThrow();
    expect(() => store.open(-1, sink, new SeededRng(1), 5)).toThrow();
  });
});
