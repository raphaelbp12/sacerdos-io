import { describe, expect, it } from "vitest";
import { asCombatant } from "../combat";
import { KNIGHT, createCharacter } from "../character";
import type { ModifierSource } from "../stats";
import { monsterById, scaleMonster } from "../monsters";
import { SeededRng } from "../rng";
import { Battle } from "./battle";
import { BattleUnit } from "./battle-unit";
import { RecordingEvents } from "./events";

function source(attribute: string, value: number): ModifierSource {
  return {
    getModifiers: () => [
      { attribute: attribute as never, kind: "flat", value },
    ],
  };
}

function knightUnit(
  x: number,
  { level = 10, sources = [] as ModifierSource[] } = {},
): BattleUnit {
  const character = createCharacter(KNIGHT, level, undefined, sources);
  return new BattleUnit(asCombatant(character, "Knight"), "party", x, []);
}

function goblinUnit(x: number, level = 1): BattleUnit {
  const monster = scaleMonster(monsterById("goblin-grunt"), level, [
    "physical",
  ]);
  return new BattleUnit(monster, "enemy", x, [], monster.element);
}

function runToEnd(battle: Battle, maxTicks = 5000, deltaMs = 100): void {
  let ticks = 0;
  while (battle.status === "ongoing" && ticks < maxTicks) {
    battle.tick(deltaMs);
    ticks += 1;
  }
}

describe("Battle events (M24)", () => {
  it("emits an onHit per landed basic attack with the dealt damage and element", () => {
    const events = new RecordingEvents();
    const battle = new Battle(
      [knightUnit(0, { sources: [source("physicalDamage", 80)] })],
      [goblinUnit(5)],
      new SeededRng(7),
      events,
    );
    runToEnd(battle);

    const hits = events.events.filter((e) => e.type === "hit");
    expect(hits.length).toBeGreaterThan(0);
    const landed = hits.find((h) => h.type === "hit" && h.damage > 0);
    expect(landed).toBeDefined();
    if (landed?.type === "hit") {
      expect(landed.element).toBe("physical");
      expect(landed.target).toBe(battle.enemies[0].name);
    }
  });

  it("emits defeated:true on the lethal hit, then an onDeath for the same unit", () => {
    const events = new RecordingEvents();
    const battle = new Battle(
      [knightUnit(0, { sources: [source("physicalDamage", 500)] })],
      [goblinUnit(5)],
      new SeededRng(3),
      events,
    );
    runToEnd(battle);

    const all = events.events;
    const lethalIdx = all.findIndex((e) => e.type === "hit" && e.defeated);
    expect(lethalIdx).toBeGreaterThanOrEqual(0);
    const death = all[lethalIdx + 1];
    expect(death.type).toBe("death");
    if (death.type === "death") {
      expect(death.unit).toBe(battle.enemies[0].name);
      expect(death.side).toBe("enemy");
    }
  });

  it("emits blocked:true with zero damage when a hit is blocked", () => {
    const events = new RecordingEvents();
    // A tanky knight that always blocks (blockChance 1) and deals no damage, so the
    // goblin survives and keeps swinging into the block.
    const blocker = knightUnit(0, {
      sources: [source("blockChance", 1), source("physicalDamage", 0)],
    });
    const goblin = goblinUnit(5);
    const battle = new Battle([blocker], [goblin], new SeededRng(1), events);

    let ticks = 0;
    while (ticks < 200) {
      battle.tick(100);
      ticks += 1;
    }

    const blocked = events.events.filter((e) => e.type === "hit" && e.blocked);
    expect(blocked.length).toBeGreaterThan(0);
    for (const b of blocked) {
      if (b.type === "hit") {
        expect(b.damage).toBe(0);
        expect(b.target).toBe(blocker.name);
      }
    }
  });

  it("runs byte-identically with and without an observer (determinism)", () => {
    const seed = 42;
    const silent = new Battle(
      [knightUnit(0, { sources: [source("physicalDamage", 40)] })],
      [goblinUnit(5)],
      new SeededRng(seed),
    );
    const observed = new Battle(
      [knightUnit(0, { sources: [source("physicalDamage", 40)] })],
      [goblinUnit(5)],
      new SeededRng(seed),
      new RecordingEvents(),
    );

    runToEnd(silent);
    runToEnd(observed);

    expect(observed.status).toBe(silent.status);
    expect(observed.enemies[0].combatant.currentHP).toBe(
      silent.enemies[0].combatant.currentHP,
    );
    expect(observed.party[0].combatant.currentHP).toBe(
      silent.party[0].combatant.currentHP,
    );
  });
});
