import { describe, it, expect } from "vitest";
import { ITEM_BASES } from "./item-bases";
import { EQUIPMENT_SLOTS } from "./equipment-slot";
import { STATS } from "../stats/stat";

describe("ITEM_BASES database invariants", () => {
  it("every slot is a valid EquipmentSlot", () => {
    for (const base of ITEM_BASES) {
      expect(EQUIPMENT_SLOTS).toContain(base.slot);
    }
  });

  it("every rollableAttributes entry is a valid Stat", () => {
    for (const base of ITEM_BASES) {
      for (const attr of base.rollableAttributes) {
        expect(STATS).toContain(attr);
      }
    }
  });

  it("every rollableAttributes list is non-empty", () => {
    for (const base of ITEM_BASES) {
      expect(base.rollableAttributes.length).toBeGreaterThan(0);
    }
  });

  it("every id is unique", () => {
    const ids = ITEM_BASES.map((b) => b.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every minLevel is >= 1", () => {
    for (const base of ITEM_BASES) {
      expect(base.minLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it("covers all 7 equipment slots at level 1", () => {
    const level1Slots = new Set(
      ITEM_BASES.filter((b) => b.minLevel === 1).map((b) => b.slot),
    );
    for (const slot of EQUIPMENT_SLOTS) {
      expect(level1Slots.has(slot)).toBe(true);
    }
  });
});
