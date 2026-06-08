import { describe, it, expect } from "vitest";
import { baseValueForLevel } from "./level-curve";

describe("baseValueForLevel", () => {
  it("returns 5 at level 1 (agreed baseline)", () => {
    expect(baseValueForLevel(1)).toBe(5);
  });

  it("is monotonically non-decreasing", () => {
    for (let level = 1; level < 50; level++) {
      expect(baseValueForLevel(level + 1)).toBeGreaterThanOrEqual(
        baseValueForLevel(level),
      );
    }
  });

  it("returns an integer at every level", () => {
    for (let level = 1; level <= 50; level++) {
      expect(Number.isInteger(baseValueForLevel(level))).toBe(true);
    }
  });

  describe("anchor points (conscious tuning guards)", () => {
    it("level 1 → 5", () => {
      expect(baseValueForLevel(1)).toBe(5);
    });

    it("level 5 → 17", () => {
      expect(baseValueForLevel(5)).toBe(17);
    });

    it("level 10 → 32", () => {
      expect(baseValueForLevel(10)).toBe(32);
    });
  });
});
