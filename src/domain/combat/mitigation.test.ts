import { describe, it, expect } from "vitest";
import {
  applyDamageReduction,
  applyArmor,
  applyResist,
  applyAbsorption,
  floorDamage,
  mitigate,
} from "./mitigation";
import type { DefenseInputs } from "./mitigation";

const NO_DEFENSE: DefenseInputs = {
  damageReduction: 0,
  armor: 0,
  resist: 0,
  absorption: 0,
};

describe("applyDamageReduction", () => {
  it("0% leaves damage unchanged", () => {
    expect(applyDamageReduction(100, 0)).toBe(100);
  });

  it("25% off 100 → 75", () => {
    expect(applyDamageReduction(100, 0.25)).toBe(75);
  });
});

describe("applyArmor", () => {
  it("zero armor leaves damage unchanged", () => {
    expect(applyArmor(100, 0)).toBe(100);
  });

  it("armor 100 halves physical damage", () => {
    expect(applyArmor(100, 100)).toBe(50);
  });
});

describe("applyResist", () => {
  it("0 resist leaves damage unchanged", () => {
    expect(applyResist(100, 0)).toBe(100);
  });

  it("0.4 resist off 100 → 60", () => {
    expect(applyResist(100, 0.4)).toBeCloseTo(60, 10);
  });
});

describe("applyAbsorption", () => {
  it("subtracts a flat amount", () => {
    expect(applyAbsorption(50, 8)).toBe(42);
  });

  it("can go below zero (floor is a separate layer)", () => {
    expect(applyAbsorption(5, 8)).toBe(-3);
  });
});

describe("floorDamage", () => {
  it("leaves damage above 1 unchanged", () => {
    expect(floorDamage(42)).toBe(42);
  });

  it("clamps zero or negative to 1", () => {
    expect(floorDamage(0)).toBe(1);
    expect(floorDamage(-5)).toBe(1);
  });
});

describe("mitigate (full pipeline)", () => {
  it("no defense returns the raw damage", () => {
    expect(mitigate(100, "physical", NO_DEFENSE)).toBe(100);
  });

  it("applies reduction → armor → absorption in order (physical)", () => {
    // 200 → -50% reduction → 100 → armor 100 (-50%) → 50 → -10 absorption → 40
    const defense: DefenseInputs = {
      damageReduction: 0.5,
      armor: 100,
      resist: 0,
      absorption: 10,
    };
    expect(mitigate(200, "physical", defense)).toBeCloseTo(40, 10);
  });

  it("uses element resist (not armor) for elemental hits", () => {
    // 100 → 0 reduction → resist 0.4 → 60 → 0 absorption → 60
    const defense: DefenseInputs = {
      damageReduction: 0,
      armor: 1000, // ignored for fire
      resist: 0.4,
      absorption: 0,
    };
    expect(mitigate(100, "fire", defense)).toBeCloseTo(60, 10);
  });

  it("floors received damage at a minimum of 1", () => {
    const defense: DefenseInputs = {
      damageReduction: 0.9,
      armor: 0,
      resist: 0,
      absorption: 1000,
    };
    expect(mitigate(50, "physical", defense)).toBe(1);
  });
});
