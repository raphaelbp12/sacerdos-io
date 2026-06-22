import { describe, it, expect } from "vitest";
import type { Item } from "../items/item";
import type { Rarity } from "../items/rarity";
import { RARITIES } from "../items/rarity";
import { sellValue } from "./alchemy";

const equip = (rarity: Rarity, itemLevel: number): Item => ({
  id: "x",
  name: "X",
  rarity,
  kind: "equippable",
  levelReq: 1,
  itemLevel,
  slot: "weapon",
  modifiers: [],
});

describe("sellValue", () => {
  it("matches the overview anchors", () => {
    expect(sellValue(equip("Common", 1))).toBe(10);
    expect(sellValue(equip("Legendary", 10))).toBe(6750);
  });

  it("grows monotonically with rarity at a fixed level", () => {
    const values = RARITIES.map((r) => sellValue(equip(r, 10)));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it("grows monotonically with item level at a fixed rarity", () => {
    expect(sellValue(equip("Common", 10))).toBeGreaterThan(
      sellValue(equip("Common", 1)),
    );
    expect(sellValue(equip("Common", 15))).toBeGreaterThan(
      sellValue(equip("Common", 10)),
    );
  });

  it("falls back to levelReq when itemLevel is absent", () => {
    const noLevel: Item = {
      id: "y",
      name: "Y",
      rarity: "Common",
      kind: "equippable",
      levelReq: 1,
      slot: "weapon",
      modifiers: [],
    };
    expect(sellValue(noLevel)).toBe(10);
  });
});
