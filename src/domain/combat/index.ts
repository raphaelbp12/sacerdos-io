/** Public barrel for the combat subsystem. */
export {
  timeBetweenAttacks,
  effectiveCooldown,
  physicalResist,
  maxHP,
  dps,
  effectiveHP,
  timeToKill,
  ARMOR_K,
} from "./derived";
export {
  computeHitDamage,
  hitDamageFromStats,
  ELEMENT_DAMAGE_STAT,
} from "./damage";
export type { DamageElement, HitDamageInputs } from "./damage";
export {
  applyDamageReduction,
  applyArmor,
  applyResist,
  applyAbsorption,
  floorDamage,
  mitigate,
} from "./mitigation";
export type { DefenseInputs } from "./mitigation";
export { asCombatant } from "./combatant";
export type { Combatant } from "./combatant";
export { TrainingDummy } from "./training-dummy";
export {
  resolveAttack,
  basicHitDamage,
  ELEMENT_RESIST_STAT,
} from "./resolve-attack";
export type { AttackResult } from "./resolve-attack";
