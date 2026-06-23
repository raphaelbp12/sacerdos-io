/** Public barrel for the battle engine (M10). */

export type { Side } from "./battlefield";
export {
  advanceDirection,
  approach,
  distance,
  frontMost,
  stepFor,
} from "./battlefield";

export {
  MOVE_SPEED,
  BASIC_ATTACK_RANGE,
  SKILL_RANGE,
  PARTY_START_X,
  ENEMY_SPAWN_X,
  UNIT_SPACING,
  STAGE_LEFT_LIMIT,
} from "./tuning";

export type { SkillLoadoutEntry } from "./battle-unit";
export { BattleUnit } from "./battle-unit";

export type { BattleStatus } from "./battle";
export { Battle } from "./battle";

export type { StageStatus } from "./stage-runner";
export { StageRunner } from "./stage-runner";

export type {
  BattleEvents,
  BattleEvent,
  HitEvent,
  SkillEvent,
  DeathEvent,
} from "./events";
export { NO_OP_EVENTS, RecordingEvents } from "./events";
