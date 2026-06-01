import { describe, it, expect } from "vitest";
import { scaleItem } from "./scale-item";
import type { Item } from "./item";

/** Base item template with a flat AGI modifier of value 5. */
const BASE_ITEM: Item = {
  id: "agi-boots",
  name: "Boots of Agility",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  slot: "boots",
  modifiers: [{ attribute: "AGI", kind: "flat", value: 5 }],
};

describe("scaleItem — Milestone 4 acceptance", () => {
  it("Common (1×): flat modifier value is unchanged", () => {
    const item = scaleItem({ ...BASE_ITEM, rarity: "Common" });
    expect(item.modifiers[0].value).toBe(5);
  });

  it("Rare (3×): flat modifier value is tripled", () => {
    const item = scaleItem({ ...BASE_ITEM, rarity: "Rare" });
    expect(item.modifiers[0].value).toBe(15);
  });

  it("Legendary (5×): flat modifier value is quintupled", () => {
    const item = scaleItem({ ...BASE_ITEM, rarity: "Legendary" });
    expect(item.modifiers[0].value).toBe(25);
  });

  it("same base item at Common vs Rare yields different AGI bonus", () => {
    const common = scaleItem({ ...BASE_ITEM, rarity: "Common" });
    const rare = scaleItem({ ...BASE_ITEM, rarity: "Rare" });
    expect(rare.modifiers[0].value).toBeGreaterThan(common.modifiers[0].value);
  });

  it("percentage modifier value is also scaled", () => {
    const item: Item = {
      ...BASE_ITEM,
      rarity: "Uncommon",
      modifiers: [{ attribute: "MP", kind: "percentage", value: 0.1 }],
    };
    const scaled = scaleItem(item);
    expect(scaled.modifiers[0].value).toBeCloseTo(0.2); // 0.1 × 2
  });

  it("all modifiers on a multi-modifier item are scaled", () => {
    const item: Item = {
      ...BASE_ITEM,
      rarity: "Epic",
      modifiers: [
        { attribute: "STR", kind: "flat", value: 3 },
        { attribute: "AGI", kind: "flat", value: 2 },
      ],
    };
    const scaled = scaleItem(item);
    expect(scaled.modifiers[0].value).toBe(12); // 3 × 4
    expect(scaled.modifiers[1].value).toBe(8); // 2 × 4
  });

  it("returns a new item object — does not mutate the original", () => {
    const original: Item = { ...BASE_ITEM, rarity: "Rare" };
    const scaled = scaleItem(original);
    expect(scaled).not.toBe(original);
    expect(original.modifiers[0].value).toBe(5); // unchanged
  });

  it("non-equippable fields (id, name, rarity, kind, levelReq) are preserved", () => {
    const scaled = scaleItem({ ...BASE_ITEM, rarity: "Rare" });
    expect(scaled.id).toBe(BASE_ITEM.id);
    expect(scaled.name).toBe(BASE_ITEM.name);
    expect(scaled.rarity).toBe("Rare");
    expect(scaled.kind).toBe(BASE_ITEM.kind);
    expect(scaled.levelReq).toBe(BASE_ITEM.levelReq);
  });
});
