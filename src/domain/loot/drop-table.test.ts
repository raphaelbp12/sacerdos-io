import { describe, it, expect } from "vitest";
import { SeededRng } from "../rng/seeded-rng";
import { EQUIPMENT_SLOTS, rarityMultiplier } from "../items";
import {
  categoryForSlot,
  weightedPick,
  rollDrop,
  type DropTable,
} from "./drop-table";
import { COMMON_CHEST_TABLE } from "./chest-def";

describe("categoryForSlot", () => {
  it("maps every equipment slot to a category", () => {
    for (const slot of EQUIPMENT_SLOTS) {
      expect(["weapon", "armor", "accessory"]).toContain(categoryForSlot(slot));
    }
  });

  it("classifies weapon / armor / accessory", () => {
    expect(categoryForSlot("weapon")).toBe("weapon");
    expect(categoryForSlot("body")).toBe("armor");
    expect(categoryForSlot("boots")).toBe("armor");
    expect(categoryForSlot("ring")).toBe("accessory");
    expect(categoryForSlot("amulet")).toBe("accessory");
  });
});

describe("weightedPick", () => {
  it("is deterministic under a seed", () => {
    const a = weightedPick({ a: 1, b: 1 }, new SeededRng(7));
    const b = weightedPick({ a: 1, b: 1 }, new SeededRng(7));
    expect(a).toBe(b);
  });

  it("only ever returns a key with positive weight", () => {
    for (let seed = 0; seed < 50; seed++) {
      const pick = weightedPick({ a: 5, b: 0, c: 5 }, new SeededRng(seed));
      expect(pick).not.toBe("b");
    }
  });

  it("throws when no positive weight exists", () => {
    expect(() => weightedPick({ a: 0 }, new SeededRng(1))).toThrow();
  });

  it("respects proportional weights within tolerance", () => {
    const counts: Record<string, number> = { a: 0, b: 0 };
    const rng = new SeededRng(123);
    const N = 20000;
    for (let i = 0; i < N; i++) {
      counts[weightedPick({ a: 3, b: 1 }, rng)] += 1;
    }
    expect(counts.a / N).toBeCloseTo(0.75, 1);
  });
});

describe("rollDrop", () => {
  it("is deterministic under a seed", () => {
    const i1 = rollDrop(COMMON_CHEST_TABLE, new SeededRng(42), 5);
    const i2 = rollDrop(COMMON_CHEST_TABLE, new SeededRng(42), 5);
    expect(i1).toEqual(i2);
  });

  it("only rolls categories present in the table (common chest = weapon or armor)", () => {
    for (let seed = 0; seed < 100; seed++) {
      const item = rollDrop(COMMON_CHEST_TABLE, new SeededRng(seed), 5);
      const cat = categoryForSlot(item.slot!);
      expect(cat).not.toBe("accessory");
    }
  });

  it("only rolls rarities present in the table (common chest never Epic/Legendary)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const item = rollDrop(COMMON_CHEST_TABLE, new SeededRng(seed), 5);
      expect(["Common", "Uncommon", "Rare"]).toContain(item.rarity);
      expect(rarityMultiplier(item.rarity)).toBeLessThanOrEqual(3);
    }
  });

  it("reproduces the overview's grade odds within tolerance", () => {
    const counts: Record<string, number> = { Common: 0, Uncommon: 0, Rare: 0 };
    const rng = new SeededRng(2024);
    const N = 100000;
    for (let i = 0; i < N; i++) {
      counts[rollDrop(COMMON_CHEST_TABLE, rng, 5).rarity] += 1;
    }
    expect(counts.Common / N).toBeCloseTo(0.78, 1);
    expect(counts.Uncommon / N).toBeCloseTo(0.206, 1);
    expect(counts.Rare / N).toBeCloseTo(0.0137, 2);
  });

  it("throws when no eligible base exists for the rolled category", () => {
    const empty: DropTable = {
      id: "empty",
      rarityWeights: { Common: 1 },
      categoryWeights: { weapon: 1 },
    };
    // itemLevel 0 makes every base (minLevel >= 1) ineligible.
    expect(() => rollDrop(empty, new SeededRng(1), 0)).toThrow();
  });
});
