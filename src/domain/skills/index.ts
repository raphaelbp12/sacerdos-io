/** Public surface for the skills module (M8). */

export type { SkillDef, SkillKind, SkillRange } from "./skill-def";
export { KNIGHT_SKILLS, skillById } from "./skill-def";

export { CooldownTracker } from "./cooldown-tracker";

export type { ChargeBuffDef } from "./charge-tracker";
export { ChargeTracker } from "./charge-tracker";

export type { SkillDamageResult } from "./resolve-skill";
export {
  resolveSkillDamage,
  resolveDebuff,
  resolveBuff,
  buildDebuff,
  buildChargeBuff,
} from "./resolve-skill";
