import { describe, it, expect } from "vitest";
import {
  timeBetweenAttacks,
  effectiveCooldown,
  physicalResist,
  maxHP,
  ARMOR_K,
} from "./derived";

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
