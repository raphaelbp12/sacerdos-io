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
