import { describe, expect, it } from "vitest";
import {
  levelForTotalXp,
  splitXpAmongLiving,
  xpForKill,
  xpRequiredForLevel,
} from "./xp";

describe("xp", () => {
  it("awards more XP for bosses than for normal monsters", () => {
    expect(xpForKill("monster", 10)).toBe(10);
    expect(xpForKill("stageBoss", 10)).toBeGreaterThan(
      xpForKill("monster", 10),
    );
    expect(xpForKill("actBoss", 10)).toBeGreaterThan(
      xpForKill("stageBoss", 10),
    );
  });

  it("splits XP equally among living members", () => {
    const members = [{ alive: true }, { alive: true }, { alive: true }];
    expect(splitXpAmongLiving(30, members)).toEqual([10, 10, 10]);
  });

  it("gives a dead member no XP", () => {
    const members = [{ alive: true }, { alive: false }, { alive: true }];
    expect(splitXpAmongLiving(30, members)).toEqual([15, 0, 15]);
  });

  it("gives nobody XP when the whole group is dead", () => {
    const members = [{ alive: false }, { alive: false }];
    expect(splitXpAmongLiving(30, members)).toEqual([0, 0]);
  });

  it("floors uneven shares", () => {
    const members = [{ alive: true }, { alive: true }];
    expect(splitXpAmongLiving(7, members)).toEqual([3, 3]);
  });

  it("has a monotonic level curve anchored at level 1 = 0 XP", () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(2)).toBeGreaterThan(xpRequiredForLevel(1));
    expect(xpRequiredForLevel(3)).toBeGreaterThan(xpRequiredForLevel(2));
  });

  it("maps accumulated XP back to a level", () => {
    expect(levelForTotalXp(0)).toBe(1);
    expect(levelForTotalXp(xpRequiredForLevel(2))).toBe(2);
    expect(levelForTotalXp(xpRequiredForLevel(2) - 1)).toBe(1);
    expect(levelForTotalXp(xpRequiredForLevel(5))).toBe(5);
  });

  it("rejects an invalid level or negative XP", () => {
    expect(() => xpRequiredForLevel(0)).toThrow(/level must be an integer/);
    expect(() => levelForTotalXp(-1)).toThrow(/totalXp must be >= 0/);
  });
});
