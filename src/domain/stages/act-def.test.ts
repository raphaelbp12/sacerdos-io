import { describe, expect, it } from "vitest";
import { ACTS, actByIndex, buildAct, stageAt } from "./act-def";

describe("act-def", () => {
  it("ships two acts, each with nine stages", () => {
    expect(ACTS).toHaveLength(2);
    for (const act of ACTS) {
      expect(act.stages).toHaveLength(9);
      expect(act.stages.map((s) => s.index)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
    }
  });

  it("act 1 is physical only; act 2 adds fire", () => {
    expect(actByIndex(1).allowedElements).toEqual(["physical"]);
    expect(actByIndex(2).allowedElements).toEqual(["physical", "fire"]);
  });

  it("monster and item level ramp monotonically across a stage", () => {
    const stages = actByIndex(1).stages;
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i].monsterLevel).toBeGreaterThan(
        stages[i - 1].monsterLevel,
      );
      expect(stages[i].itemLevel).toBeGreaterThan(stages[i - 1].itemLevel);
    }
  });

  it("act 1 stage 1 anchors at level 1 with 1 gold per monster", () => {
    const stage = stageAt(1, 1);
    expect(stage.monsterLevel).toBe(1);
    expect(stage.itemLevel).toBe(1);
    expect(stage.goldPerMonster).toBe(1);
  });

  it("the act boss outscales the act's final stage", () => {
    const act = actByIndex(1);
    expect(act.boss.monsterLevel).toBeGreaterThan(act.stages[8].monsterLevel);
    expect(act.boss.goldReward).toBeGreaterThan(
      act.stages[8].goldPerMonster * 10,
    );
  });

  it("buildAct expands compact tuning into nine ramped stages", () => {
    const act = buildAct({
      id: "test",
      index: 9,
      name: "Test",
      allowedElements: ["physical"],
      weakMonsterId: "goblin-grunt",
      strongMonsterId: "orc-brute",
      stageBossId: "ogre-warlord",
      actBossId: "ogre-warlord",
      baseLevel: 5,
      baseGoldPerMonster: 2,
      baseXpPerMonster: 4,
    });
    expect(act.stages[0].monsterLevel).toBe(5);
    expect(act.stages[8].monsterLevel).toBe(13);
    expect(act.stages[0].monsterId).toBe("goblin-grunt");
    expect(act.stages[8].monsterId).toBe("orc-brute");
  });

  it("throws for an out-of-range act or stage", () => {
    expect(() => actByIndex(99)).toThrow(/no act at index 99/);
    expect(() => stageAt(1, 99)).toThrow(/no stage 99 in act 1/);
  });
});
