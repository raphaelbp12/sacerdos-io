import { describe, it, expect } from "vitest";
import { SeededRng } from "../rng/seeded-rng";
import {
  DROP_TABLES,
  firstChest,
  openChest,
  type ChestTier,
  type Chest,
} from "./chest-def";

describe("DROP_TABLES", () => {
  it("has a table for every chest tier", () => {
    const tiers: ChestTier[] = ["common", "rare", "legendary"];
    for (const tier of tiers) {
      expect(DROP_TABLES[tier]).toBeDefined();
    }
  });

  it("common chest carries the overview's first-chest grade odds", () => {
    expect(DROP_TABLES.common.rarityWeights).toEqual({
      Common: 78,
      Uncommon: 20.6,
      Rare: 1.37,
    });
  });
});

describe("firstChest", () => {
  it("is a common chest with a guaranteed class-weapon base", () => {
    const chest = firstChest("short-sword");
    expect(chest.tier).toBe("common");
    expect(chest.guaranteedBaseId).toBe("short-sword");
  });
});

describe("openChest", () => {
  it("first drop is always the class weapon, at Common rarity", () => {
    const chest = firstChest("short-sword");
    for (let seed = 0; seed < 50; seed++) {
      const item = openChest(chest, new SeededRng(seed), 5);
      expect(item.slot).toBe("weapon");
      expect(item.name).toBe("Short Sword");
      expect(item.rarity).toBe("Common");
    }
  });

  it("is deterministic under a seed", () => {
    const chest: Chest = { tier: "common" };
    const a = openChest(chest, new SeededRng(99), 5);
    const b = openChest(chest, new SeededRng(99), 5);
    expect(a).toEqual(b);
  });

  it("rolls the tier's drop table for a non-guaranteed chest", () => {
    const item = openChest({ tier: "common" }, new SeededRng(3), 5);
    expect(item.kind).toBe("equippable");
    expect(["Common", "Uncommon", "Rare"]).toContain(item.rarity);
  });

  it("throws on an unknown guaranteed base id", () => {
    const chest: Chest = { tier: "common", guaranteedBaseId: "nope" };
    expect(() => openChest(chest, new SeededRng(1), 5)).toThrow();
  });
});
