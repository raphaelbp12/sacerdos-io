import { describe, it, expect } from "vitest";
import { RARITIES, rarityMultiplier } from "./rarity";

describe("Rarity", () => {
  it("defines exactly 5 rarity tiers", () => {
    expect(RARITIES).toHaveLength(5);
  });

  it("has Common as the lowest tier with multiplier 1", () => {
    expect(rarityMultiplier("Common")).toBe(1);
  });

  it("has Legendary as the highest tier with multiplier 5", () => {
    expect(rarityMultiplier("Legendary")).toBe(5);
  });

  it("returns ascending multipliers for each tier in order", () => {
    expect(RARITIES.map(rarityMultiplier)).toEqual([1, 2, 3, 4, 5]);
  });
});
