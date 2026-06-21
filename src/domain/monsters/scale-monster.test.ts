import { describe, expect, it } from "vitest";
import { SeededRng } from "../rng";
import { resolveAttack } from "../combat";
import {
  BOSS_STAT_MULTIPLIER,
  MONSTER_BASES,
  Monster,
  monsterById,
  scaleBoss,
  scaleMonster,
} from "./index";

const PHYSICAL_ONLY = ["physical"] as const;
const ACT2 = ["physical", "fire"] as const;

const weak = monsterById("goblin-grunt");
const strong = monsterById("orc-brute");
const boss = monsterById("ogre-warlord");

describe("MONSTER_BASES", () => {
  it("exposes the seeded roster with unique ids", () => {
    const ids = MONSTER_BASES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining(["goblin-grunt", "orc-brute", "ogre-warlord"]),
    );
  });

  it("monsterById throws for an unknown id", () => {
    expect(() => monsterById("dragon")).toThrow(/unknown monster/i);
  });
});

describe("scaleMonster — linear per-monster scaling", () => {
  it("at level 1 equals the base stat block", () => {
    const m = scaleMonster(weak, 1, PHYSICAL_ONLY);
    expect(m.getStat("hp")).toBe(weak.baseStats.hp);
    expect(m.getStat("attack")).toBe(weak.baseStats.attack);
    expect(m.getStat("armor")).toBe(weak.baseStats.armor);
  });

  it("grows by perLevelGains × (level - 1)", () => {
    const level = 10;
    const m = scaleMonster(strong, level, PHYSICAL_ONLY);
    expect(m.getStat("hp")).toBe(
      strong.baseStats.hp + strong.perLevelGains.hp * (level - 1),
    );
    expect(m.getStat("attack")).toBe(
      strong.baseStats.attack + strong.perLevelGains.attack * (level - 1),
    );
  });

  it("starts a scaled monster at full HP and lets it take damage", () => {
    const m = scaleMonster(weak, 3, PHYSICAL_ONLY);
    expect(m.currentHP).toBe(m.getStat("hp"));
    m.takeDamage(5);
    expect(m.currentHP).toBe(m.getStat("hp") - 5);
    m.takeDamage(99999);
    expect(m.currentHP).toBe(0);
    m.reset();
    expect(m.currentHP).toBe(m.getStat("hp"));
  });

  it("rejects a non-integer or sub-1 level", () => {
    expect(() => scaleMonster(weak, 0, PHYSICAL_ONLY)).toThrow();
    expect(() => scaleMonster(weak, -2, PHYSICAL_ONLY)).toThrow();
    expect(() => scaleMonster(weak, 1.5, PHYSICAL_ONLY)).toThrow();
  });

  it("is a Monster instance implementing Combatant", () => {
    const m = scaleMonster(weak, 1, PHYSICAL_ONLY);
    expect(m).toBeInstanceOf(Monster);
    expect(typeof m.getStat).toBe("function");
    expect(typeof m.takeDamage).toBe("function");
  });
});

describe("scaleMonster — element resolution by allowedElements", () => {
  it("deals physical when its preferred element is not allowed (act 1)", () => {
    const m = scaleMonster(boss, 5, PHYSICAL_ONLY);
    expect(m.element).toBe("physical");
    expect(m.getStat("physicalDamage")).toBe(
      boss.baseStats.flatDamage + boss.perLevelGains.flatDamage * 4,
    );
    expect(m.getStat("fireDamage")).toBe(0);
  });

  it("deals its preferred element when allowed (act 2)", () => {
    const m = scaleMonster(boss, 5, ACT2);
    expect(m.element).toBe("fire");
    expect(m.getStat("fireDamage")).toBe(
      boss.baseStats.flatDamage + boss.perLevelGains.flatDamage * 4,
    );
    expect(m.getStat("physicalDamage")).toBe(0);
  });

  it("scaled monster works as a resolveAttack attacker against a player-like target", () => {
    const m = scaleMonster(strong, 5, PHYSICAL_ONLY);
    const target = scaleMonster(weak, 5, PHYSICAL_ONLY);
    const result = resolveAttack(m, target, new SeededRng(1), "physical");
    expect(result.damage).toBeGreaterThanOrEqual(1);
    expect(target.currentHP).toBeLessThan(target.getStat("hp"));
  });
});

describe("scaleBoss — a normal monster with higher stats (9.2)", () => {
  it("multiplies stats by BOSS_STAT_MULTIPLIER", () => {
    const normal = scaleMonster(strong, 1, PHYSICAL_ONLY);
    const b = scaleBoss(strong, 1, PHYSICAL_ONLY);
    expect(b.getStat("hp")).toBe(normal.getStat("hp") * BOSS_STAT_MULTIPLIER);
    expect(b.getStat("attack")).toBe(
      normal.getStat("attack") * BOSS_STAT_MULTIPLIER,
    );
    expect(b.getStat("armor")).toBe(
      normal.getStat("armor") * BOSS_STAT_MULTIPLIER,
    );
  });

  it("applies the multiplier before flooring", () => {
    // raw hp at L2 = base + perLevel, multiplied then floored
    const raw = strong.baseStats.hp + strong.perLevelGains.hp * (2 - 1);
    const b = scaleBoss(strong, 2, PHYSICAL_ONLY);
    expect(b.getStat("hp")).toBe(Math.floor(raw * BOSS_STAT_MULTIPLIER));
  });
});
