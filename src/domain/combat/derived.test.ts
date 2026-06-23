import { describe, it, expect } from "vitest";
import {
  timeBetweenAttacks,
  effectiveCooldown,
  physicalResist,
  maxHP,
  dps,
  effectiveHP,
  timeToKill,
  ARMOR_K,
} from "./derived";
import type { Stat } from "../stats";

/** Tiny stat reader for worked-number tests. Missing stats read as 0. */
function reader(stats: Partial<Record<Stat, number>>): (s: Stat) => number {
  return (s) => stats[s] ?? 0;
}

describe("timeBetweenAttacks", () => {
  it("attackSpeed 1.0 → 1000 ms", () => {
    expect(timeBetweenAttacks(1.0)).toBe(1000);
  });

  it("attackSpeed 2.0 → 500 ms", () => {
    expect(timeBetweenAttacks(2.0)).toBe(500);
  });

  it("higher attack speed means shorter interval", () => {
    expect(timeBetweenAttacks(1.5)).toBeLessThan(timeBetweenAttacks(1.0));
  });
});

describe("effectiveCooldown", () => {
  it("no reduction leaves the base cooldown unchanged", () => {
    expect(effectiveCooldown(3000, 0)).toBe(3000);
  });

  it("0.2 reduction on 3000 ms → 2400 ms", () => {
    expect(effectiveCooldown(3000, 0.2)).toBe(2400);
  });

  it("full reduction yields zero cooldown", () => {
    expect(effectiveCooldown(3000, 1)).toBe(0);
  });
});

describe("physicalResist", () => {
  it("zero armor → zero resist", () => {
    expect(physicalResist(0)).toBe(0);
  });

  it("negative armor clamps to zero resist", () => {
    expect(physicalResist(-50)).toBe(0);
  });

  it("armor equal to K → 0.5 resist", () => {
    expect(physicalResist(ARMOR_K)).toBe(0.5);
  });

  it("armor 300 → 0.75 resist", () => {
    expect(physicalResist(300)).toBeCloseTo(0.75, 10);
  });

  it("diminishing returns: never reaches 1.0", () => {
    expect(physicalResist(1_000_000)).toBeLessThan(1);
  });

  it("more armor always means more resist", () => {
    expect(physicalResist(200)).toBeGreaterThan(physicalResist(100));
  });
});

describe("maxHP", () => {
  it("returns the final hp stat", () => {
    const getStat = (stat: "hp") => (stat === "hp" ? 137 : 0);
    expect(maxHP(getStat)).toBe(137);
  });
});

describe("dps", () => {
  it("hit damage × attacks/sec (starter pd+5 L1: 10×5×1 = 50)", () => {
    const getStat = reader({ attack: 10, physicalDamage: 5, attackSpeed: 1 });
    expect(dps(getStat)).toBe(50);
  });

  it("doubling attack speed doubles DPS", () => {
    const getStat = reader({ attack: 10, physicalDamage: 5, attackSpeed: 2 });
    expect(dps(getStat)).toBe(100);
  });

  it("folds in % increased damage", () => {
    const getStat = reader({
      attack: 10,
      physicalDamage: 5,
      damage: 0.5,
      attackSpeed: 1,
    });
    expect(dps(getStat)).toBe(75);
  });
});

describe("effectiveHP", () => {
  it("no armor → raw hp", () => {
    expect(effectiveHP(reader({ hp: 100 }))).toBe(100);
  });

  it("armor equal to K doubles effective HP (50% resist)", () => {
    expect(effectiveHP(reader({ hp: 100, armor: ARMOR_K }))).toBeCloseTo(
      200,
      10,
    );
  });

  it("more armor always raises effective HP", () => {
    const a = effectiveHP(reader({ hp: 100, armor: 50 }));
    const b = effectiveHP(reader({ hp: 100, armor: 200 }));
    expect(b).toBeGreaterThan(a);
  });
});

describe("timeToKill", () => {
  it("EHP ÷ DPS (defender 200 EHP, attacker 50 DPS → 4s)", () => {
    const attacker = reader({ attack: 10, physicalDamage: 5, attackSpeed: 1 });
    const defender = reader({ hp: 100, armor: ARMOR_K });
    expect(timeToKill(attacker, defender)).toBeCloseTo(4, 10);
  });

  it("is infinite when the attacker deals no damage", () => {
    const attacker = reader({ attack: 0, physicalDamage: 0 });
    const defender = reader({ hp: 100 });
    expect(timeToKill(attacker, defender)).toBe(Infinity);
  });
});
