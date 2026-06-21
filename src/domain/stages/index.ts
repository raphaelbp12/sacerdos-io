/** Public barrel for the stages / acts / progression subsystem (M11). */

export type { Difficulty, DifficultyDef } from "./difficulty";
export { DIFFICULTIES, difficultyById } from "./difficulty";

export type { StageDef, ActBossDef } from "./stage-def";

export type { ActDef } from "./act-def";
export { ACTS, buildAct, actByIndex, stageAt } from "./act-def";

export {
  buildStageWaves,
  buildActBossWaves,
  stageItemLevel,
  stageMonsterLevel,
} from "./build-waves";

export type { StagePosition } from "./progression";
export {
  advance,
  retreat,
  isFinalStage,
  isDifficultyUnlocked,
} from "./progression";

export type { BossKey } from "./boss-key";
export {
  makeBossKey,
  hasBossKeyFor,
  settleBossKeyAfterFight,
} from "./boss-key";

export type { KillSource, XpRecipient } from "./xp";
export {
  xpForKill,
  splitXpAmongLiving,
  xpRequiredForLevel,
  levelForTotalXp,
} from "./xp";
