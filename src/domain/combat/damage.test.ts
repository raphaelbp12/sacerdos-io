import { describe, it, expect } from "vitest";
import {
  computeHitDamage,
  hitDamageFromStats,
  ELEMENT_DAMAGE_STAT,
} from "./damage";
import type { Stat } from "../stats";

describe("computeHitDamage", () => {
  it("attack 10 × physicalDamage 5 × (1 + 0) → 50", () => {
    expect(
      computeHitDamage({ attack: 10, flatDamage: 5, damagePercent: 0 }),
    ).toBe(50);
  });

  it("damagePercent scales linearly: 0.5 → 75", () => {
    expect(
      computeHitDamage({ attack: 10, flatDamage: 5, damagePercent: 0.5 }),
    ).toBe(75);
  });

  it("more attack strictly increases output", () => {
    const base = computeHitDamage({
      attack: 10,
      flatDamage: 5,
      damagePercent: 0,
    });
    const more = computeHitDamage({
      attack: 12,
      flatDamage: 5,
      damagePercent: 0,
    });
    expect(more).toBeGreaterThan(base);
  });

  it("more flat damage strictly increases output", () => {
    const base = computeHitDamage({
      attack: 10,
      flatDamage: 5,
      damagePercent: 0,
    });
    const more = computeHitDamage({
      attack: 10,
      flatDamage: 7,
      damagePercent: 0,
    });
    expect(more).toBeGreaterThan(base);
  });

  it("zero flat damage of an element yields zero", () => {
    expect(
      computeHitDamage({ attack: 10, flatDamage: 0, damagePercent: 1 }),
    ).toBe(0);
  });
});

describe("ELEMENT_DAMAGE_STAT", () => {
  it("maps each element to its canonical flat-damage stat", () => {
    expect(ELEMENT_DAMAGE_STAT.physical).toBe("physicalDamage");
    expect(ELEMENT_DAMAGE_STAT.fire).toBe("fireDamage");
    expect(ELEMENT_DAMAGE_STAT.cold).toBe("coldDamage");
    expect(ELEMENT_DAMAGE_STAT.lightning).toBe("lightningDamage");
    expect(ELEMENT_DAMAGE_STAT.chaos).toBe("chaosDamage");
  });
});

describe("hitDamageFromStats", () => {
  const stats: Partial<Record<Stat, number>> = {
    attack: 10,
    physicalDamage: 5,
    fireDamage: 8,
    damage: 0,
  };
  const getStat = (stat: Stat) => stats[stat] ?? 0;

  it("defaults to a physical hit", () => {
    expect(hitDamageFromStats(getStat)).toBe(50);
  });

  it("uses the element's flat-damage stat when given an element", () => {
    expect(hitDamageFromStats(getStat, "fire")).toBe(80);
  });

  it("folds the damage% stat into the result", () => {
    const buffed = (stat: Stat) => (stat === "damage" ? 0.2 : getStat(stat));
    expect(hitDamageFromStats(buffed)).toBeCloseTo(60, 10);
  });
});
