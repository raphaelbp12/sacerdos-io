import { describe, it, expect } from "vitest";
import { rollRarity } from "./roll-rarity";
import { RARITIES } from "./rarity";
import { SeededRng } from "../rng/seeded-rng";

describe("rollRarity", () => {
  it("always returns a valid Rarity", () => {
    const rng = new SeededRng(100);
    for (let i = 0; i < 200; i++) {
      expect(RARITIES).toContain(rollRarity(rng));
    }
  });

  it("is deterministic for the same seed", () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    for (let i = 0; i < 50; i++) {
      expect(rollRarity(a)).toBe(rollRarity(b));
    }
  });

  it("seed 42 first roll is a known rarity (regression lock)", () => {
    const rng = new SeededRng(42);
    // Locked after first run — change only if weights are intentionally adjusted.
    expect(rollRarity(rng)).toBe("Uncommon");
  });

  it("distribution is weighted: Common appears far more often than Legendary", () => {
    const rng = new SeededRng(9999);
    const counts: Record<string, number> = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
    };
    const ROLLS = 1000;
    for (let i = 0; i < ROLLS; i++) {
      counts[rollRarity(rng)]++;
    }
    expect(counts["Common"]).toBeGreaterThan(counts["Legendary"]);
    expect(counts["Common"]).toBeGreaterThan(counts["Rare"]);
    // Sanity: every rarity should appear at least once in 1000 rolls
    for (const rarity of RARITIES) {
      expect(counts[rarity]).toBeGreaterThan(0);
    }
  });
});
