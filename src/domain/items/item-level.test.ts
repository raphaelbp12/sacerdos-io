import { describe, it, expect } from "vitest";
import { itemLevelOf } from "./item-level";
import type { Item } from "./item";

const equip = (over: Partial<Item> = {}): Item => ({
  id: "x",
  name: "X",
  rarity: "Common",
  kind: "equippable",
  levelReq: 3,
  slot: "weapon",
  modifiers: [],
  ...over,
});

describe("itemLevelOf", () => {
  it("returns the explicit itemLevel when present", () => {
    expect(itemLevelOf(equip({ itemLevel: 12 }))).toBe(12);
  });

  it("falls back to levelReq when itemLevel is absent", () => {
    expect(itemLevelOf(equip())).toBe(3);
  });
});
