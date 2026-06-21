/**
 * Wave builders (M11): turn stage/act content into the `Monster[][]` waves that
 * M10's `StageRunner` consumes. This is the seam between *content* (stages, acts)
 * and the *engine* (battle) — the runner stays content-agnostic (DRY).
 *
 * Pure & deterministic: no `Rng`. A stage's monster composition is fixed, so the
 * same stage + difficulty always produces the same waves (fixed reward).
 */

import type { Monster } from "../monsters";
import { monsterById, scaleBoss, scaleMonster } from "../monsters";
import type { ActDef } from "./act-def";
import type { Difficulty } from "./difficulty";
import { difficultyById } from "./difficulty";
import type { StageDef } from "./stage-def";

/** A stage's effective monster level for a difficulty (base + bonus). */
export function stageMonsterLevel(
  stage: StageDef,
  difficulty: Difficulty,
): number {
  return stage.monsterLevel + difficultyById(difficulty).monsterLevelBonus;
}

/** A stage's effective loot item level for a difficulty (base + bonus). */
export function stageItemLevel(
  stage: StageDef,
  difficulty: Difficulty,
): number {
  return stage.itemLevel + difficultyById(difficulty).itemLevelBonus;
}

/**
 * Build a stage's waves: each regular wave from the stage's monster archetype,
 * then a final **stage-boss** wave (`scaleBoss`). Total monster count is
 * `sum(waveSizes) + 1`.
 */
export function buildStageWaves(
  act: ActDef,
  stage: StageDef,
  difficulty: Difficulty,
): Monster[][] {
  const level = stageMonsterLevel(stage, difficulty);
  const elements = act.allowedElements;
  const monsterDef = monsterById(stage.monsterId);
  const bossDef = monsterById(stage.bossId);

  const regularWaves = stage.waveSizes.map((size) =>
    Array.from({ length: size }, () =>
      scaleMonster(monsterDef, level, elements),
    ),
  );
  const bossWave = [scaleBoss(bossDef, level, elements)];

  return [...regularWaves, bossWave];
}

/** Build the single-boss wave for an act's key-gated act-boss encounter. */
export function buildActBossWaves(
  act: ActDef,
  difficulty: Difficulty,
): Monster[][] {
  const level =
    act.boss.monsterLevel + difficultyById(difficulty).monsterLevelBonus;
  const bossDef = monsterById(act.boss.bossId);
  return [[scaleBoss(bossDef, level, act.allowedElements)]];
}
