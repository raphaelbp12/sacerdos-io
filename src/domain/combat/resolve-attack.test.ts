import { describe, it, expect } from "vitest";
import { resolveAttack } from "./resolve-attack";
import { asCombatant } from "./combatant";
import { TrainingDummy } from "./training-dummy";
import { Character } from "../stats";
import { Equipment } from "../items";
import type { Item } from "../items";
import { SeededRng } from "../rng";
import type { Rng } from "../rng";

const SEED = 12345;

/** An rng with fully scripted nextFloat values, for avoidance tests. */
function scriptedRng(floats: number[]): Rng {
  let i = 0;
  return {
    nextFloat: () => floats[i++] ?? 0,
    nextInt: () => 0,
  };
}

const ATTACK_WEAPON: Item = {
  id: "sharp-sword",
  name: "Sharp Sword",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  slot: "weapon",
  modifiers: [{ attribute: "attack", kind: "flat", value: 5 }],
};

function attacker(equipment?: Equipment): ReturnType<typeof asCombatant> {
  const eq = equipment ?? new Equipment();
  const character = new Character({ hp: 100, attack: 10, physicalDamage: 5 }, [
    eq,
  ]);
  return asCombatant(character, "Hero");
}

describe("resolveAttack — basic physical hit", () => {
  it("deals mitigated damage and reduces the dummy's HP", () => {
    const dummy = new TrainingDummy("Dummy", { hp: 1000 });
    const result = resolveAttack(attacker(), dummy, new SeededRng(SEED));
    // attack 10 × physicalDamage 5 × (1+0) = 50, no defense → 50
    expect(result.damage).toBe(50);
    expect(result.dodged).toBe(false);
    expect(result.blocked).toBe(false);
    expect(dummy.currentHP).toBe(950);
  });

  it("is deterministic under the same seed", () => {
    const a = resolveAttack(
      attacker(),
      new TrainingDummy("D", { hp: 1000 }),
      new SeededRng(SEED),
    );
    const b = resolveAttack(
      attacker(),
      new TrainingDummy("D", { hp: 1000 }),
      new SeededRng(SEED),
    );
    expect(a).toEqual(b);
  });

  it("armor on the defender reduces physical damage", () => {
    const dummy = new TrainingDummy("Armored", { hp: 1000, armor: 100 });
    const result = resolveAttack(attacker(), dummy, new SeededRng(SEED));
    // 50 raw → armor 100 (-50%) → 25
    expect(result.damage).toBe(25);
  });

  it("reports defeated when the hit drops HP to 0", () => {
    const dummy = new TrainingDummy("Fragile", { hp: 50 });
    const result = resolveAttack(attacker(), dummy, new SeededRng(SEED));
    expect(dummy.currentHP).toBe(0);
    expect(result.defeated).toBe(true);
  });
});

describe("resolveAttack — avoidance (physical only)", () => {
  it("a dodge roll under dodgeChance zeroes the hit", () => {
    const dummy = new TrainingDummy("Nimble", { hp: 1000, dodgeChance: 0.5 });
    // first nextFloat = dodge roll
    const result = resolveAttack(attacker(), dummy, scriptedRng([0.1]));
    expect(result.dodged).toBe(true);
    expect(result.damage).toBe(0);
    expect(dummy.currentHP).toBe(1000);
  });

  it("a block roll under blockChance zeroes the hit (dodge rolled first)", () => {
    const dummy = new TrainingDummy("Shield", { hp: 1000, blockChance: 0.5 });
    // dodge roll fails (0.9), block roll succeeds (0.1)
    const result = resolveAttack(attacker(), dummy, scriptedRng([0.9, 0.1]));
    expect(result.blocked).toBe(true);
    expect(result.damage).toBe(0);
    expect(dummy.currentHP).toBe(1000);
  });

  it("elemental hits ignore block and dodge", () => {
    const dummy = new TrainingDummy("Nimble", {
      hp: 1000,
      dodgeChance: 0.99,
      blockChance: 0.99,
      fireDamage: 0,
    });
    const fireHero = asCombatant(
      new Character({ hp: 100, attack: 10, fireDamage: 4 }),
      "Pyro",
    );
    const result = resolveAttack(
      fireHero,
      dummy,
      scriptedRng([0.0, 0.0]),
      "fire",
    );
    // not avoided: attack 10 × fireDamage 4 = 40
    expect(result.dodged).toBe(false);
    expect(result.blocked).toBe(false);
    expect(result.damage).toBe(40);
  });
});

describe("resolveAttack — headline acceptance", () => {
  it("a +attack weapon yields strictly more damage under the same seed", () => {
    const dummyA = new TrainingDummy("D", { hp: 1000 });
    const dummyB = new TrainingDummy("D", { hp: 1000 });

    const without = resolveAttack(attacker(), dummyA, new SeededRng(SEED));

    const equipped = new Equipment();
    equipped.equip(ATTACK_WEAPON, 1);
    const with_ = resolveAttack(
      attacker(equipped),
      dummyB,
      new SeededRng(SEED),
    );

    expect(with_.damage).toBeGreaterThan(without.damage);
  });
});
