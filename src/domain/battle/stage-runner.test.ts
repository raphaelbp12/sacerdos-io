import { describe, expect, it } from "vitest";
import { asCombatant } from "../combat";
import { KNIGHT, createCharacter } from "../character";
import type { ModifierSource } from "../stats";
import { monsterById, scaleBoss, scaleMonster } from "../monsters";
import type { Monster } from "../monsters";
import { SeededRng } from "../rng";
import { BattleUnit } from "./battle-unit";
import { StageRunner } from "./stage-runner";

function weapon(physicalDamage: number): ModifierSource {
  return {
    getModifiers: () => [
      { attribute: "physicalDamage", kind: "flat", value: physicalDamage },
    ],
  };
}

function knightUnit(level = 12, phys = 14): BattleUnit {
  const character = createCharacter(KNIGHT, level, undefined, [weapon(phys)]);
  return new BattleUnit(asCombatant(character, "Knight"), "party", 0);
}

/** Three weak goblin waves followed by a boss wave (a higher-stat goblin). */
function normalStage(): Monster[][] {
  const goblin = () =>
    scaleMonster(monsterById("goblin-grunt"), 1, ["physical"]);
  const boss = scaleBoss(monsterById("goblin-grunt"), 1, ["physical"]);
  return [[goblin()], [goblin(), goblin()], [goblin()], [boss]];
}

function runStage(runner: StageRunner, maxTicks = 40000): number {
  let ticks = 0;
  while (runner.status === "ongoing" && ticks < maxTicks) {
    runner.tick(100);
    ticks += 1;
  }
  return ticks;
}

describe("StageRunner construction", () => {
  it("rejects an empty stage", () => {
    expect(() => new StageRunner([knightUnit()], [], new SeededRng(1))).toThrow(
      /at least one wave/,
    );
  });

  it("reports a fixed total monster count for a script", () => {
    const runner = new StageRunner(
      [knightUnit()],
      normalStage(),
      new SeededRng(1),
    );
    expect(runner.waveCount).toBe(4);
    expect(runner.totalMonsters).toBe(5); // 1 + 2 + 1 + 1
    expect(runner.currentWaveIndex).toBe(0);
  });
});

describe("StageRunner progression", () => {
  it("runs every wave then the boss and ends cleared", () => {
    const runner = new StageRunner(
      [knightUnit()],
      normalStage(),
      new SeededRng(9),
    );
    runStage(runner);
    expect(runner.status).toBe("cleared");
    expect(runner.currentWaveIndex).toBe(runner.waveCount - 1); // reached the boss wave
  });

  it("wipes the party against an overtuned wave", () => {
    const weakKnight = knightUnit(1, 1);
    const overtuned = [
      scaleMonster(monsterById("orc-brute"), 50, ["physical"]),
    ];
    const runner = new StageRunner([weakKnight], [overtuned], new SeededRng(2));
    runStage(runner);
    expect(runner.status).toBe("wiped");
  });
});

describe("StageRunner determinism", () => {
  it("the same party + script + seed always yields the same outcome", () => {
    const a = new StageRunner(
      [knightUnit()],
      normalStage(),
      new SeededRng(123),
    );
    const b = new StageRunner(
      [knightUnit()],
      normalStage(),
      new SeededRng(123),
    );
    const ticksA = runStage(a);
    const ticksB = runStage(b);
    expect(a.status).toBe("cleared");
    expect(ticksA).toBe(ticksB);
    expect(b.status).toBe(a.status);
  });
});
