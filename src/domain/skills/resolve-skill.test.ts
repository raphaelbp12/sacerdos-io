import { describe, it, expect } from "vitest";
import { Character } from "../stats";
import { asCombatant, basicHitDamage } from "../combat";
import { BuffTracker } from "../effects";
import { skillById } from "./skill-def";
import { ChargeTracker } from "./charge-tracker";
import {
  resolveSkillDamage,
  resolveBuff,
  resolveDebuff,
} from "./resolve-skill";

function knight() {
  // attack 10, physicalDamage 5 → basic raw 50 before defense.
  return new Character({ attack: 10, physicalDamage: 5 });
}

describe("resolveSkillDamage", () => {
  it("smash rank 1 deals 200% of a basic attack's final damage", () => {
    const attacker = asCombatant(knight(), "Knight");
    const target = new Character({ hp: 1000 });
    const defender = asCombatant(target, "Dummy");

    const basic = basicHitDamage(attacker, defender);
    const result = resolveSkillDamage(
      skillById("smash"),
      1,
      attacker,
      defender,
    );

    expect(result.damage).toBeCloseTo(2.0 * basic);
    expect(result.kind).toBe("damage");
    expect(result.element).toBe("physical");
    expect(target.currentHP).toBeCloseTo(1000 - result.damage);
  });

  it("scales smash by rank (rank 5 = 400%)", () => {
    const attacker = asCombatant(knight(), "Knight");
    const defender = asCombatant(new Character({ hp: 1000 }), "Dummy");
    const basic = basicHitDamage(attacker, defender);

    const r5 = resolveSkillDamage(skillById("smash"), 5, attacker, defender);
    expect(r5.damage).toBeCloseTo(4.0 * basic);
  });

  it("respects the defender's armor (mitigated basic flows through)", () => {
    const attacker = asCombatant(knight(), "Knight");
    const armored = asCombatant(
      new Character({ hp: 1000, armor: 100 }),
      "Armored",
    );
    const naked = asCombatant(new Character({ hp: 1000 }), "Naked");

    const onArmored = resolveSkillDamage(
      skillById("smash"),
      1,
      attacker,
      armored,
    ).damage;
    const onNaked = resolveSkillDamage(
      skillById("smash"),
      1,
      attacker,
      naked,
    ).damage;
    expect(onArmored).toBeLessThan(onNaked);
  });

  it("flags shatter as area damage", () => {
    const attacker = asCombatant(knight(), "Knight");
    const defender = asCombatant(new Character({ hp: 1000 }), "Dummy");
    const result = resolveSkillDamage(
      skillById("shatter"),
      1,
      attacker,
      defender,
    );
    expect(result.kind).toBe("areaDamage");
  });

  it("rejects resolving a non-damage skill as damage", () => {
    const attacker = asCombatant(knight(), "Knight");
    const defender = asCombatant(new Character({ hp: 1000 }), "Dummy");
    expect(() =>
      resolveSkillDamage(skillById("provoke"), 1, attacker, defender),
    ).toThrow(/not a damage skill/i);
  });
});

describe("resolveDebuff (provoke)", () => {
  it("lowers the target's effective damageReduction and raises damage taken", () => {
    const targetBuffs = new BuffTracker();
    const target = new Character(
      { hp: 1000, damageReduction: 0.5 },
      [],
      1,
      targetBuffs,
    );
    const defender = asCombatant(target, "Foe");
    const attacker = asCombatant(knight(), "Knight");

    const before = basicHitDamage(attacker, defender);
    expect(target.getStat("damageReduction")).toBeCloseTo(0.5);

    resolveDebuff(skillById("provoke"), 1, targetBuffs); // -0.20
    expect(target.getStat("damageReduction")).toBeCloseTo(0.3);

    const after = basicHitDamage(attacker, defender);
    expect(after).toBeGreaterThan(before);
  });

  it("the provoke debuff never expires over time", () => {
    const targetBuffs = new BuffTracker();
    const target = new Character({ damageReduction: 0.5 }, [], 1, targetBuffs);
    resolveDebuff(skillById("provoke"), 1, targetBuffs);
    targetBuffs.advance(1_000_000);
    expect(target.getStat("damageReduction")).toBeCloseTo(0.3);
  });

  it("rejects resolving a non-debuff skill as a debuff", () => {
    expect(() =>
      resolveDebuff(skillById("smash"), 1, new BuffTracker()),
    ).toThrow(/not a debuff skill/i);
  });
});

describe("resolveBuff (raise-shield)", () => {
  it("sets blockChance to 100% for the next N hits", () => {
    const charges = new ChargeTracker();
    const knightChar = new Character({ blockChance: 0.1 }, [charges]);
    resolveBuff(skillById("raise-shield"), 1, charges); // 3 charges

    expect(charges.remainingCharges("raise-shield")).toBe(3);
    expect(knightChar.getStat("blockChance")).toBe(1);

    charges.consume();
    charges.consume();
    charges.consume();
    expect(knightChar.getStat("blockChance")).toBeCloseTo(0.1);
  });

  it("uses the rank's charge count (rank 3 = 5 charges)", () => {
    const charges = new ChargeTracker();
    resolveBuff(skillById("raise-shield"), 3, charges);
    expect(charges.remainingCharges("raise-shield")).toBe(5);
  });

  it("rejects resolving a non-buff skill as a buff", () => {
    expect(() =>
      resolveBuff(skillById("provoke"), 1, new ChargeTracker()),
    ).toThrow(/not a buff skill/i);
  });
});
