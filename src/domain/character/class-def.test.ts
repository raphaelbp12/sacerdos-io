import { describe, it, expect } from "vitest";
import { KNIGHT, CLASSES } from "./class-def";

describe("class definitions", () => {
  it("Knight starts at 100 hp / 10 attack / 10 armor at level 1", () => {
    expect(KNIGHT.baseStatsAtLevel1).toEqual({
      hp: 100,
      attack: 10,
      armor: 10,
    });
  });

  it("Knight gains +10 hp / +1 attack / +3 armor per level", () => {
    expect(KNIGHT.perLevelGains).toEqual({ hp: 10, attack: 1, armor: 3 });
  });

  it("registers the Knight in the class list", () => {
    expect(CLASSES).toContain(KNIGHT);
  });

  it("every class id is unique", () => {
    const ids = CLASSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
