import { describe, it, expect } from "vitest";
import { baseStatsForLevel } from "./level";
import { KNIGHT } from "./class-def";

describe("baseStatsForLevel", () => {
  it("returns the level-1 base stats at level 1", () => {
    expect(baseStatsForLevel(KNIGHT, 1)).toEqual({
      hp: 100,
      attack: 10,
      armor: 10,
    });
  });

  it("applies per-level gains at level 10", () => {
    // 100 + 9*10, 10 + 9*1, 10 + 9*3
    expect(baseStatsForLevel(KNIGHT, 10)).toEqual({
      hp: 190,
      attack: 19,
      armor: 37,
    });
  });

  it("is monotonically non-decreasing across levels", () => {
    let prev = baseStatsForLevel(KNIGHT, 1);
    for (let lvl = 2; lvl <= 40; lvl++) {
      const next = baseStatsForLevel(KNIGHT, lvl);
      expect(next.hp!).toBeGreaterThanOrEqual(prev.hp!);
      expect(next.attack!).toBeGreaterThanOrEqual(prev.attack!);
      expect(next.armor!).toBeGreaterThanOrEqual(prev.armor!);
      prev = next;
    }
  });

  it("does not mutate the class definition", () => {
    baseStatsForLevel(KNIGHT, 5);
    expect(KNIGHT.baseStatsAtLevel1).toEqual({
      hp: 100,
      attack: 10,
      armor: 10,
    });
  });

  it("rejects levels below 1", () => {
    expect(() => baseStatsForLevel(KNIGHT, 0)).toThrow();
    expect(() => baseStatsForLevel(KNIGHT, -3)).toThrow();
  });

  it("rejects non-integer levels", () => {
    expect(() => baseStatsForLevel(KNIGHT, 2.5)).toThrow();
  });
});
