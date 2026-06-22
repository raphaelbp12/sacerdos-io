import { describe, it, expect } from "vitest";
import { SeededRng } from "../rng/seeded-rng";
import type { EquipCategory } from "./socket";
import { MATERIALS, materialById, rollMaterial } from "./material";

const CATEGORIES: readonly EquipCategory[] = ["weapon", "armor", "accessory"];

describe("MATERIALS data integrity", () => {
  it("every material defines a valid range for all three categories", () => {
    for (const mat of MATERIALS) {
      for (const cat of CATEGORIES) {
        const range = mat.byCategory[cat];
        expect(range).toBeDefined();
        expect(range.max).toBeGreaterThanOrEqual(range.min);
      }
    }
  });

  it("materialById finds known materials and misses unknown ones", () => {
    expect(materialById("minor-ruby")?.name).toBe("Minor Ruby");
    expect(materialById("does-not-exist")).toBeUndefined();
  });
});

describe("rollMaterial", () => {
  it("returns a modifier matching the category's attribute and kind", () => {
    const ruby = materialById("minor-ruby")!;
    const mod = rollMaterial(new SeededRng(1), ruby, "weapon");
    expect(mod.attribute).toBe("fireDamage");
    expect(mod.kind).toBe("percentage");
  });

  it("rolls a value within the [min, max] band for every material & category", () => {
    for (const mat of MATERIALS) {
      for (const cat of CATEGORIES) {
        const range = mat.byCategory[cat];
        for (let seed = 0; seed < 50; seed++) {
          const value = rollMaterial(new SeededRng(seed), mat, cat).value;
          expect(value).toBeGreaterThanOrEqual(range.min);
          expect(value).toBeLessThanOrEqual(range.max);
        }
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const ruby = materialById("minor-ruby")!;
    const a = rollMaterial(new SeededRng(7), ruby, "armor");
    const b = rollMaterial(new SeededRng(7), ruby, "armor");
    expect(a).toEqual(b);
  });

  it("can produce different values for different seeds within the band", () => {
    const ruby = materialById("minor-ruby")!;
    const values = new Set(
      Array.from(
        { length: 20 },
        (_, s) => rollMaterial(new SeededRng(s), ruby, "accessory").value,
      ),
    );
    expect(values.size).toBeGreaterThan(1);
  });
});
