import { describe, it, expect } from "vitest";
import { Inventory } from "./inventory";
import { Stash, moveItem } from "./stash";
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

const HELM: Item = {
  id: "iron-helm",
  name: "Iron Helm",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  slot: "helm",
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

describe("Stash", () => {
  it("starts with the requested number of tabs", () => {
    const stash = new Stash(1, 20);
    expect(stash.tabs).toHaveLength(1);
    expect(stash.tabs[0].capacity).toBe(20);
  });

  it("requires at least one tab", () => {
    expect(() => new Stash(0, 20)).toThrow();
  });

  it("each tab is an independent Inventory of the given capacity", () => {
    const stash = new Stash(3, 5);
    expect(stash.tabs).toHaveLength(3);
    expect(stash.tabs.every((t) => t.capacity === 5)).toBe(true);
  });
});

describe("moveItem", () => {
  it("moves an item from one inventory to another", () => {
    const from = new Inventory(5);
    const to = new Inventory(5);
    from.add(BOOTS);
    expect(moveItem(from, to, BOOTS)).toBe(true);
    expect(from.items).not.toContain(BOOTS);
    expect(to.items).toContain(BOOTS);
  });

  it("returns false and mutates nothing when the source lacks the item", () => {
    const from = new Inventory(5);
    const to = new Inventory(5);
    expect(moveItem(from, to, BOOTS)).toBe(false);
    expect(to.items).toHaveLength(0);
  });

  it("returns false and mutates nothing when the destination is full", () => {
    const from = new Inventory(5);
    const to = new Inventory(1);
    from.add(BOOTS);
    to.add(HELM);
    expect(moveItem(from, to, BOOTS)).toBe(false);
    expect(from.items).toContain(BOOTS);
    expect(to.items).not.toContain(BOOTS);
  });

  it("moves a stackable item into a full tab that already holds its stack", () => {
    const from = new Inventory(5);
    const to = new Inventory(1);
    to.add(SCRAP); // tab now full (1 slot) but holds the iron-scrap stack
    from.add(SCRAP);
    expect(moveItem(from, to, SCRAP)).toBe(true);
    expect(to.stacks[0].count).toBe(2);
    expect(from.items).toHaveLength(0);
  });

  it("works between a player inventory and a stash tab", () => {
    const inventory = new Inventory(5);
    const stash = new Stash(1, 5);
    inventory.add(BOOTS);
    expect(moveItem(inventory, stash.tabs[0], BOOTS)).toBe(true);
    expect(stash.tabs[0].items).toContain(BOOTS);
  });
});
