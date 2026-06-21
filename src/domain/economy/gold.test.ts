import { describe, expect, it } from "vitest";

import { goldForKill, type GoldSource } from "./gold";

describe("goldForKill", () => {
  it("pays 1 gold for a weak monster at the first stage (overview anchor)", () => {
    expect(goldForKill("weakMonster", 1)).toBe(1);
  });

  it("pays a stage boss 10x a weak monster at stage level 1", () => {
    expect(goldForKill("stageBoss", 1)).toBe(10);
    expect(goldForKill("stageBoss", 1)).toBe(
      10 * goldForKill("weakMonster", 1),
    );
  });

  it("pays a strong monster 2x a weak monster (endgame 1k:2k ratio)", () => {
    expect(goldForKill("strongMonster", 1)).toBe(
      2 * goldForKill("weakMonster", 1),
    );
  });

  it("pays an act boss more than a stage boss", () => {
    expect(goldForKill("actBoss", 1)).toBe(50);
    expect(goldForKill("actBoss", 1)).toBeGreaterThan(
      goldForKill("stageBoss", 1),
    );
  });

  it("scales linearly with the stage level", () => {
    expect(goldForKill("weakMonster", 5)).toBe(5);
    expect(goldForKill("stageBoss", 3)).toBe(30);
  });

  it("adds flat gold before applying the percentage (stat-engine order)", () => {
    // (1 * 1 + 9) * (1 + 1) = 20
    expect(goldForKill("weakMonster", 1, { flat: 9, percent: 1 })).toBe(20);
  });

  it("applies a percentage increase", () => {
    expect(goldForKill("weakMonster", 10, { percent: 0.5 })).toBe(15);
  });

  it("applies a flat increase", () => {
    expect(goldForKill("weakMonster", 1, { flat: 4 })).toBe(5);
  });

  it("floors fractional results", () => {
    expect(goldForKill("weakMonster", 1, { percent: 0.25 })).toBe(1);
  });

  it("rejects a non-integer or non-positive stage level", () => {
    expect(() => goldForKill("weakMonster", 0)).toThrow();
    expect(() => goldForKill("weakMonster", -1)).toThrow();
    expect(() => goldForKill("weakMonster", 1.5)).toThrow();
  });

  it("covers every gold source", () => {
    const sources: GoldSource[] = [
      "weakMonster",
      "strongMonster",
      "stageBoss",
      "actBoss",
    ];
    for (const source of sources) {
      expect(goldForKill(source, 1)).toBeGreaterThan(0);
    }
  });
});
