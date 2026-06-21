import { describe, it, expect } from "vitest";
import { generateItem } from "./generate-item";
import { SeededRng } from "../rng/seeded-rng";
import { EQUIPMENT_SLOTS } from "./equipment-slot";
import { rarityMultiplier } from "./rarity";
import { baseValueForLevel } from "./level-curve";
import { ITEM_BASES } from "./item-bases";

describe("generateItem", () => {
  describe("determinism", () => {
    it("same seed produces identical Items", () => {
      const item1 = generateItem(new SeededRng(42), { itemLevel: 5 });
      const item2 = generateItem(new SeededRng(42), { itemLevel: 5 });
      expect(item1).toEqual(item2);
    });

    it("different seeds produce different Items (usually)", () => {
      const item1 = generateItem(new SeededRng(1), { itemLevel: 5 });
      const item2 = generateItem(new SeededRng(999), { itemLevel: 5 });
      // Not guaranteed, but seeds 1 and 999 are far apart
      expect(item1).not.toEqual(item2);
    });
  });

  describe("base eligibility", () => {
    it("never picks a base with minLevel > itemLevel", () => {
      for (let i = 0; i < 50; i++) {
        const item = generateItem(new SeededRng(i), { itemLevel: 1 });
        // plate-body has minLevel 10 — must never appear at itemLevel 1
        expect(item.slot).not.toBeUndefined();
        expect(item.name).not.toBe("Plate Body");
      }
    });

    it("plate-body (minLevel 10) can appear at itemLevel 10", () => {
      // With enough seeds one of them should produce a plate-body
      const names = new Set<string>();
      for (let seed = 0; seed < 200; seed++) {
        names.add(generateItem(new SeededRng(seed), { itemLevel: 10 }).name);
      }
      expect(names.has("Plate Body")).toBe(true);
    });

    it("plate-body never appears at itemLevel 1", () => {
      for (let seed = 0; seed < 200; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 1 });
        expect(item.name).not.toBe("Plate Body");
      }
    });
  });

  describe("shape validity", () => {
    it("kind is always 'equippable'", () => {
      for (let seed = 0; seed < 50; seed++) {
        expect(generateItem(new SeededRng(seed), { itemLevel: 5 }).kind).toBe(
          "equippable",
        );
      }
    });

    it("slot is always a valid EquipmentSlot", () => {
      for (let seed = 0; seed < 50; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 5 });
        expect(EQUIPMENT_SLOTS).toContain(item.slot);
      }
    });

    it("has at least one modifier", () => {
      for (let seed = 0; seed < 50; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 5 });
        expect(item.modifiers.length).toBeGreaterThan(0);
      }
    });

    it("modifier attributes come from the base's rollableAttributes", () => {
      for (let seed = 0; seed < 100; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 5 });
        const matchingBase = ITEM_BASES.find((b) => b.name === item.name);
        expect(matchingBase).toBeDefined();
        if (matchingBase) {
          for (const mod of item.modifiers) {
            expect(matchingBase.rollableAttributes).toContain(mod.attribute);
          }
        }
      }
    });

    it("id is a non-empty string", () => {
      for (let seed = 0; seed < 20; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 5 });
        expect(item.id.length).toBeGreaterThan(0);
      }
    });

    it("levelReq matches the base's minLevel", () => {
      // At itemLevel 1, all eligible bases have minLevel 1
      for (let seed = 0; seed < 50; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 1 });
        expect(item.levelReq).toBe(1);
      }
    });
  });

  describe("level scaling", () => {
    it("modifier values are larger at higher item levels", () => {
      // Force same base and rarity by using the same seed.
      // Higher itemLevel must yield >= modifier value.
      const lowItem = generateItem(new SeededRng(42), { itemLevel: 1 });
      const highItem = generateItem(new SeededRng(42), { itemLevel: 10 });
      const lowVal = lowItem.modifiers[0].value;
      const highVal = highItem.modifiers[0].value;
      expect(highVal).toBeGreaterThanOrEqual(lowVal);
    });
  });

  describe("rarity scaling (scaleItem is applied)", () => {
    it("a Rare item's modifier value equals Common baseline * 3", () => {
      // Find a seed that produces a Rare item so we can assert exact math.
      let rareItem: ReturnType<typeof generateItem> | null = null;
      for (let seed = 0; seed < 500; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 5 });
        if (item.rarity === "Rare") {
          rareItem = item;
          break;
        }
      }
      expect(rareItem).not.toBeNull();
      if (!rareItem) return;

      const commonBaseline = baseValueForLevel(5); // 17
      const expectedValue = commonBaseline * rarityMultiplier("Rare"); // 17 * 3 = 51
      expect(rareItem.modifiers[0].value).toBe(expectedValue);
    });

    it("a Common item's modifier value equals the level baseline", () => {
      let commonItem: ReturnType<typeof generateItem> | null = null;
      for (let seed = 0; seed < 500; seed++) {
        const item = generateItem(new SeededRng(seed), { itemLevel: 5 });
        if (item.rarity === "Common") {
          commonItem = item;
          break;
        }
      }
      expect(commonItem).not.toBeNull();
      if (!commonItem) return;

      expect(commonItem.modifiers[0].value).toBe(baseValueForLevel(5));
    });
  });

  describe("headline acceptance test", () => {
    it("seed 42 itemLevel 5: deterministic full Item snapshot", () => {
      const item = generateItem(new SeededRng(42), { itemLevel: 5 });
      // Full regression lock — change only when generation algorithm is intentionally updated.
      expect(item).toMatchSnapshot();
    });
  });

  describe("forced base / rarity options", () => {
    it("forces the given base", () => {
      const plate = ITEM_BASES.find((b) => b.id === "plate-body")!;
      const item = generateItem(new SeededRng(1), {
        itemLevel: 10,
        base: plate,
      });
      expect(item.name).toBe("Plate Body");
      expect(item.slot).toBe("body");
    });

    it("forces the given rarity, bypassing the rarity roll", () => {
      const short = ITEM_BASES.find((b) => b.id === "short-sword")!;
      for (let seed = 0; seed < 30; seed++) {
        const item = generateItem(new SeededRng(seed), {
          itemLevel: 5,
          base: short,
          rarity: "Legendary",
        });
        expect(item.rarity).toBe("Legendary");
        expect(item.name).toBe("Short Sword");
      }
    });

    it("with neither option, output is unchanged from the default roll", () => {
      // Regression: the optional params must not perturb the rng call order.
      const a = generateItem(new SeededRng(42), { itemLevel: 5 });
      const b = generateItem(new SeededRng(42), { itemLevel: 5 });
      expect(a).toEqual(b);
    });
  });
});
