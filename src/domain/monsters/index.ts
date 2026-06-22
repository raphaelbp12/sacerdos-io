/** Public barrel for the monsters subsystem (M9). */
export type { MonsterDef, MonsterStatBlock } from "./monster-def";
export { MONSTER_BASES, monsterById } from "./monster-bases";
export {
  Monster,
  scaleMonster,
  scaleBoss,
  BOSS_HP_MULTIPLIER,
  BOSS_DAMAGE_MULTIPLIER,
} from "./scale-monster";
export type { ScaleMonsterOptions } from "./scale-monster";
