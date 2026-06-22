import { describe, it, expect } from "vitest";
import type { Item } from "../items/item";
import type { Rarity } from "../items/rarity";
import type { EquipmentSlot } from "../items/equipment-slot";
import {
  cubeExpForItem,
  cubeLevelForExp,
  CUBE_EXP_THRESHOLDS,
  CUBE_OPERATIONS,
  isOperationUnlocked,
} from "./cube-exp";

const equip = (
  rarity: Rarity,
  itemLevel: number,
  slot: EquipmentSlot = "weapon",
): Item => ({
  id: "x",
  name: "X",
  rarity,
  kind: "equippable",
  levelReq: 1,
  itemLevel,
  slot,
  modifiers: [],
});

describe("cubeExpForItem", () => {
  it("matches the base-factor anchors at full level match", () => {
    // Common (grade 2) × itemLv 1 (×1) × weapon (×1) × gear (×1) × match 1.0 × 1.0 = 2.
    expect(cubeExpForItem(equip("Common", 1), 1)).toBe(2);
    // Common × itemLv 5 (×10) at cube level 5 → 2 × 10 = 20.
    expect(cubeExpForItem(equip("Common", 5), 5)).toBe(20);
  });

  it("scales by the ×3 grade ladder", () => {
    expect(cubeExpForItem(equip("Uncommon", 1), 1)).toBe(6);
    expect(cubeExpForItem(equip("Rare", 1), 1)).toBe(18);
    expect(cubeExpForItem(equip("Legendary", 1), 1)).toBe(162);
  });

  it("applies the gear-type factor", () => {
    // Amulet ×4: Common itemLv 1 → 2 × 4 = 8.
    expect(cubeExpForItem(equip("Common", 1, "amulet"), 1)).toBe(8);
  });

  it("decays with the item-vs-cube level gap", () => {
    const near = cubeExpForItem(equip("Common", 10), 10);
    const far = cubeExpForItem(equip("Common", 10), 1);
    expect(far).toBeLessThan(near);
    expect(far).toBeGreaterThan(0); // never exactly zero
  });

  it("boosts by the Cube-EXP bonus", () => {
    expect(cubeExpForItem(equip("Common", 5), 5, { expBonus: 0.5 })).toBe(30);
  });
});

describe("cubeLevelForExp", () => {
  it("returns the highest reached anchor level", () => {
    expect(cubeLevelForExp(0)).toBe(1);
    expect(cubeLevelForExp(404)).toBe(1);
    expect(cubeLevelForExp(405)).toBe(5);
    expect(cubeLevelForExp(4955)).toBe(10);
    expect(cubeLevelForExp(999_999_999)).toBe(100);
  });

  it("starts every anchor at the documented total", () => {
    for (const t of CUBE_EXP_THRESHOLDS) {
      expect(cubeLevelForExp(t.totalExp)).toBe(t.level);
    }
  });
});

describe("isOperationUnlocked", () => {
  it("locks operations below their unlock level", () => {
    expect(isOperationUnlocked("extraction", 9)).toBe(false);
    expect(isOperationUnlocked("extraction", 10)).toBe(true);
  });

  it("has synthesis and alchemy available from level 1", () => {
    expect(isOperationUnlocked("synthesis", 1)).toBe(true);
    expect(isOperationUnlocked("alchemy", 1)).toBe(true);
  });

  it("lists every operation with an unlock level and cost", () => {
    expect(CUBE_OPERATIONS).toHaveLength(8);
    expect(CUBE_OPERATIONS.every((o) => o.unlockLevel >= 1)).toBe(true);
  });
});
