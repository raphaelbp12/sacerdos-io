import { describe, expect, it } from "vitest";
import { asCombatant, TrainingDummy } from "../combat";
import { KNIGHT, createCharacter } from "../character";
import type { ModifierSource } from "../stats";
import { monsterById, scaleMonster } from "../monsters";
import { skillById } from "../skills";
import { SeededRng } from "../rng";
import { Battle } from "./battle";
import { BattleUnit } from "./battle-unit";

/** A stand-in weapon: a modifier source granting flat physicalDamage. */
function weapon(physicalDamage: number): ModifierSource {
  return {
    getModifiers: () => [
      { attribute: "physicalDamage", kind: "flat", value: physicalDamage },
    ],
  };
}

function knightUnit(
  x: number,
  { level = 10, phys = 10, skills = [] as never[] } = {},
): BattleUnit {
  const character = createCharacter(KNIGHT, level, undefined, [weapon(phys)]);
  return new BattleUnit(asCombatant(character, "Knight"), "party", x, skills);
}

function goblinUnit(x: number, level = 1): BattleUnit {
  const monster = scaleMonster(monsterById("goblin-grunt"), level, [
    "physical",
  ]);
  return new BattleUnit(monster, "enemy", x, [], monster.element);
}

function runToEnd(battle: Battle, maxTicks = 5000, deltaMs = 100): number {
  let ticks = 0;
  while (battle.status === "ongoing" && ticks < maxTicks) {
    battle.tick(deltaMs);
    ticks += 1;
  }
  return ticks;
}

describe("Battle status", () => {
  it("is ongoing while both sides have living units", () => {
    const battle = new Battle(
      [knightUnit(0)],
      [goblinUnit(5)],
      new SeededRng(1),
    );
    expect(battle.status).toBe("ongoing");
  });
});

describe("Battle — single encounter", () => {
  it("a geared party clears a one-monster wave", () => {
    const battle = new Battle(
      [knightUnit(0)],
      [goblinUnit(5)],
      new SeededRng(7),
    );
    runToEnd(battle);
    expect(battle.status).toBe("won");
    expect(battle.enemies[0].isAlive).toBe(false);
  });

  it("the party wipes against an overtuned monster", () => {
    // A weak, unarmed L1 knight vs a high-level goblin.
    const weakKnight = knightUnit(0, { level: 1, phys: 1 });
    const battle = new Battle(
      [weakKnight],
      [goblinUnit(5, 40)],
      new SeededRng(3),
    );
    runToEnd(battle);
    expect(battle.status).toBe("lost");
    expect(battle.party[0].isAlive).toBe(false);
  });

  it("focuses the front-most enemy: the back one is untouched until the front dies", () => {
    const front = goblinUnit(8); // larger x = enemy front
    const back = goblinUnit(2);
    const battle = new Battle([knightUnit(0)], [front, back], new SeededRng(5));

    // Run until the front goblin dies (it has more x, so it is the target).
    let ticks = 0;
    while (front.isAlive && ticks < 1000) {
      battle.tick(100);
      ticks += 1;
    }
    expect(front.isAlive).toBe(false);
    // The back goblin took no damage while the front was still alive.
    expect(back.combatant.currentHP).toBe(back.combatant.getStat("hp"));
  });
});

describe("Battle — deterministic replay", () => {
  function dodgyDummyTrace(seed: number): number[] {
    const knight = knightUnit(0, { phys: 10 });
    const dummy = new TrainingDummy("Dummy", { hp: 2000, dodgeChance: 0.5 });
    const battle = new Battle(
      [knight],
      [new BattleUnit(dummy, "enemy", 5)],
      new SeededRng(seed),
    );
    const trace: number[] = [];
    for (let i = 0; i < 60; i += 1) {
      battle.tick(100);
      trace.push(dummy.currentHP);
    }
    return trace;
  }

  it("the same seed reproduces an identical blow-by-blow", () => {
    expect(dodgyDummyTrace(42)).toEqual(dodgyDummyTrace(42));
  });

  it("different seeds can diverge (dodge rolls depend on the rng)", () => {
    expect(dodgyDummyTrace(1)).not.toEqual(dodgyDummyTrace(999));
  });
});

describe("Battle — skills", () => {
  it("auto-casts a ready damage skill in range and puts it on cooldown", () => {
    const smash = skillById("smash");
    const knight = knightUnit(0, {
      phys: 10,
      skills: [{ def: smash, rank: 1 }] as never,
    });
    const dummy = new TrainingDummy("Dummy", { hp: 5000 });
    const enemy = new BattleUnit(dummy, "enemy", 5);
    const battle = new Battle([knight], [enemy], new SeededRng(1));

    const before = dummy.currentHP;
    battle.tick(100); // smash is ready at t=0 and the dummy is in short range
    expect(dummy.currentHP).toBeLessThan(before); // smash landed
    expect(knight.cooldowns.isReady("smash")).toBe(false); // now on cooldown
    expect(knight.cooldowns.remainingFor("smash")).toBeGreaterThan(2000);
  });

  it("an areaDamage skill fans out to every enemy in radius", () => {
    const shatter = skillById("shatter");
    const knight = knightUnit(0, {
      phys: 10,
      skills: [{ def: shatter, rank: 1 }] as never,
    });
    // Both dummies within the area radius (30) of the caster.
    const a = new TrainingDummy("A", { hp: 5000 });
    const b = new TrainingDummy("B", { hp: 5000 });
    const battle = new Battle(
      [knight],
      [new BattleUnit(a, "enemy", 10), new BattleUnit(b, "enemy", 25)],
      new SeededRng(1),
    );

    battle.tick(100); // shatter ready at t=0, both dummies in radius
    expect(a.currentHP).toBeLessThan(5000);
    expect(b.currentHP).toBeLessThan(5000);
  });
});
