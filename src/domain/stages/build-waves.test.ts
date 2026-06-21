import { describe, expect, it } from "vitest";
import { actByIndex, stageAt } from "./act-def";
import {
  buildActBossWaves,
  buildStageWaves,
  stageItemLevel,
  stageMonsterLevel,
} from "./build-waves";

describe("build-waves", () => {
  it("appends a stage-boss wave after the regular waves", () => {
    const act = actByIndex(1);
    const stage = stageAt(1, 1);
    const waves = buildStageWaves(act, stage, "normal");
    expect(waves).toHaveLength(stage.waveSizes.length + 1);
    expect(waves[waves.length - 1]).toHaveLength(1); // the boss wave
  });

  it("produces a fixed total monster count for a stage", () => {
    const act = actByIndex(1);
    const stage = stageAt(1, 1);
    const expected = stage.waveSizes.reduce((a, b) => a + b, 0) + 1;
    const total = (d: "normal" | "hard") =>
      buildStageWaves(act, stage, d).reduce((sum, w) => sum + w.length, 0);
    expect(total("normal")).toBe(expected);
    expect(total("hard")).toBe(expected);
  });

  it("act 1 monsters deal physical damage", () => {
    const act = actByIndex(1);
    const waves = buildStageWaves(act, stageAt(1, 1), "normal");
    for (const wave of waves) {
      for (const monster of wave) {
        expect(monster.element).toBe("physical");
      }
    }
  });

  it("the act-2 stage boss deals fire damage", () => {
    const act = actByIndex(2);
    const waves = buildStageWaves(act, stageAt(2, 1), "normal");
    const bossWave = waves[waves.length - 1];
    expect(bossWave[0].element).toBe("fire");
  });

  it("hard raises a stage's item and monster level", () => {
    const stage = stageAt(1, 3);
    expect(stageItemLevel(stage, "hard")).toBeGreaterThan(
      stageItemLevel(stage, "normal"),
    );
    expect(stageMonsterLevel(stage, "hard")).toBeGreaterThan(
      stageMonsterLevel(stage, "normal"),
    );
  });

  it("scales stronger monsters on hard than on normal", () => {
    const act = actByIndex(1);
    const stage = stageAt(1, 1);
    const normalBoss = buildStageWaves(act, stage, "normal").at(-1)![0];
    const hardBoss = buildStageWaves(act, stage, "hard").at(-1)![0];
    expect(hardBoss.getStat("hp")).toBeGreaterThan(normalBoss.getStat("hp"));
  });

  it("builds a single-boss wave for the act boss", () => {
    const act = actByIndex(1);
    const waves = buildActBossWaves(act, "normal");
    expect(waves).toHaveLength(1);
    expect(waves[0]).toHaveLength(1);
  });
});
