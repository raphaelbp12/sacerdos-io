import { describe, it, expect } from "vitest";
import {
  STATS,
  defaultStat,
  clampStat,
  statAcceptsKind,
  type Stat,
} from "./stat";

describe("STATS / STAT_SCHEMA", () => {
  it("has no duplicate stats", () => {
    expect(new Set(STATS).size).toBe(STATS.length);
  });

  it("contains the canonical combat stats and none of the bootstrap attributes", () => {
    expect(STATS).toContain("attack");
    expect(STATS).toContain("physicalDamage");
    expect(STATS).toContain("hp");
    // bootstrap attributes are gone
    expect(STATS as readonly string[]).not.toContain("STR");
    expect(STATS as readonly string[]).not.toContain("MP");
  });

  it("every stat has a numeric default", () => {
    for (const stat of STATS) {
      expect(typeof defaultStat(stat)).toBe("number");
    }
  });

  it("attackSpeed defaults to 1.0 attack/sec", () => {
    expect(defaultStat("attackSpeed")).toBe(1.0);
  });
});

describe("clampStat", () => {
  const CLAMPED: Stat[] = [
    "blockChance",
    "dodgeChance",
    "cooldownReduction",
    "damageReduction",
    "fireResist",
    "coldResist",
    "lightningResist",
    "chaosResist",
  ];

  it("clamps chance/resist/reduction stats into [0, 1]", () => {
    for (const stat of CLAMPED) {
      expect(clampStat(stat, 1.5)).toBe(1);
      expect(clampStat(stat, -0.3)).toBe(0);
      expect(clampStat(stat, 0.4)).toBeCloseTo(0.4);
    }
  });

  it("leaves unbounded stats unchanged", () => {
    expect(clampStat("hp", 9999)).toBe(9999);
    expect(clampStat("attack", -5)).toBe(-5);
    expect(clampStat("damage", 3)).toBe(3); // damage% can exceed 1 (+300%)
  });
});

describe("statAcceptsKind", () => {
  it("multiplicative stats accept flat and percentage", () => {
    for (const stat of [
      "hp",
      "attack",
      "armor",
      "physicalDamage",
      "attackSpeed",
    ] as Stat[]) {
      expect(statAcceptsKind(stat, "flat")).toBe(true);
      expect(statAcceptsKind(stat, "percentage")).toBe(true);
    }
  });

  it("fraction/chance stats accept flat but reject percentage", () => {
    for (const stat of [
      "damage",
      "blockChance",
      "dodgeChance",
      "fireResist",
    ] as Stat[]) {
      expect(statAcceptsKind(stat, "flat")).toBe(true);
      expect(statAcceptsKind(stat, "percentage")).toBe(false);
    }
  });
});
