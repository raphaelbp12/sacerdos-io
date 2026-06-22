import { describe, it, expect } from "vitest";
import { Inventory } from "./inventory";
import type { Item } from "./item";

const BOOTS: Item = {
  id: "boots-of-agility",
  name: "Boots of Agility",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  slot: "boots",
  modifiers: [{ attribute: "attack", kind: "flat", value: 5 }],
};

const POTION: Item = {
  id: "health-potion",
  name: "Health Potion",
  rarity: "Common",
  kind: "consumable",
  levelReq: 1,
  modifiers: [],
};

const SCRAP: Item = {
  id: "iron-scrap",
  name: "Iron Scrap",
  rarity: "Common",
  kind: "misc",
  levelReq: 1,
  modifiers: [],
};

const CLOTH: Item = {
  id: "cloth-strip",
  name: "Cloth Strip",
  rarity: "Common",
  kind: "misc",
  levelReq: 1,
  modifiers: [],
};

describe("Inventory", () => {
  it("starts empty", () => {
    expect(new Inventory().items).toHaveLength(0);
  });

  it("add puts an item in the list", () => {
    const inv = new Inventory();
    inv.add(BOOTS);
    expect(inv.items).toContain(BOOTS);
  });

  it("can hold multiple items", () => {
    const inv = new Inventory();
    inv.add(BOOTS);
    inv.add(POTION);
    expect(inv.items).toHaveLength(2);
  });

  it("remove takes an item out by reference", () => {
    const inv = new Inventory();
    inv.add(BOOTS);
    inv.remove(BOOTS);
    expect(inv.items).toHaveLength(0);
  });

  it("remove returns true when the item was found and removed", () => {
    const inv = new Inventory();
    inv.add(BOOTS);
    expect(inv.remove(BOOTS)).toBe(true);
  });

  it("remove returns false when the item is not in the inventory", () => {
    expect(new Inventory().remove(BOOTS)).toBe(false);
  });
});

describe("Inventory capacity", () => {
  it("is unlimited by default", () => {
    const inv = new Inventory();
    expect(inv.capacity).toBe(Infinity);
    expect(inv.hasSpace()).toBe(true);
    expect(inv.isFull).toBe(false);
  });

  it("rejects a non-integer or negative finite capacity", () => {
    expect(() => new Inventory(-1)).toThrow();
    expect(() => new Inventory(1.5)).toThrow();
  });

  it("counts one slot per non-stackable item", () => {
    const inv = new Inventory(3);
    inv.add(BOOTS);
    inv.add(POTION);
    expect(inv.slotsUsed).toBe(2);
  });

  it("blocks add past capacity without mutating the store", () => {
    const inv = new Inventory(1);
    expect(inv.add(BOOTS)).toBe(true);
    expect(inv.isFull).toBe(true);
    expect(inv.hasSpace()).toBe(false);
    expect(inv.add(POTION)).toBe(false);
    expect(inv.items).toHaveLength(1);
    expect(inv.items).not.toContain(POTION);
  });
});

describe("Inventory stacking", () => {
  it("stacks identical misc items into a single slot", () => {
    const inv = new Inventory(10);
    inv.add(SCRAP);
    inv.add(SCRAP);
    inv.add(SCRAP);
    expect(inv.slotsUsed).toBe(1);
    expect(inv.stacks).toHaveLength(1);
    expect(inv.stacks[0]).toMatchObject({ id: "iron-scrap", count: 3 });
  });

  it("gives distinct misc ids their own slots", () => {
    const inv = new Inventory(10);
    inv.add(SCRAP);
    inv.add(CLOTH);
    expect(inv.slotsUsed).toBe(2);
  });

  it("does not stack non-misc items even with the same id", () => {
    const inv = new Inventory(10);
    inv.add(BOOTS);
    inv.add(BOOTS);
    expect(inv.slotsUsed).toBe(2);
  });

  it("accepts a stackable item joining an existing stack even when full", () => {
    const inv = new Inventory(1);
    expect(inv.add(SCRAP)).toBe(true);
    expect(inv.isFull).toBe(true);
    expect(inv.canAccept(SCRAP)).toBe(true);
    expect(inv.add(SCRAP)).toBe(true);
    expect(inv.slotsUsed).toBe(1);
    expect(inv.stacks[0].count).toBe(2);
  });

  it("rejects a brand-new stackable item when full", () => {
    const inv = new Inventory(1);
    inv.add(SCRAP);
    expect(inv.canAccept(CLOTH)).toBe(false);
    expect(inv.add(CLOTH)).toBe(false);
    expect(inv.slotsUsed).toBe(1);
  });
});
