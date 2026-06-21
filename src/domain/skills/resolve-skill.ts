import type { Combatant } from "../combat";
import { basicHitDamage } from "../combat";
import type { DamageElement } from "../combat";
import type { BuffDef, BuffTracker } from "../effects";
import type { SkillDef, SkillKind } from "./skill-def";
import type { ChargeBuffDef, ChargeTracker } from "./charge-tracker";

/** Outcome of resolving a damage skill. */
export interface SkillDamageResult {
  readonly skillId: string;
  readonly kind: SkillKind;
  /** Damage actually dealt. */
  readonly damage: number;
  /** Whether the defender is at 0 HP after the hit. */
  readonly defeated: boolean;
  readonly element: DamageElement;
}

/** Reads `values[rank-1]`, validating `rank` against the skill's max. */
function valueForRank(def: SkillDef, rank: number): number {
  if (!Number.isInteger(rank) || rank < 1 || rank > def.maxRank) {
    throw new Error(
      `Rank ${rank} is out of range for "${def.id}" (1..${def.maxRank}).`,
    );
  }
  return def.values[rank - 1];
}

/**
 * Resolve a damage skill (smash / shatter): `multiplier × basicHitDamage`.
 *
 * Skill damage is defined as a multiple of a basic attack's final (mitigated)
 * damage, so gear, `attack`, and `damage%` flow through automatically via
 * `getStat`. Skills bypass block/dodge — the multiplier is deterministic.
 *
 * `areaDamage` resolves single-target for now; multi-target fan-out is M10.
 */
export function resolveSkillDamage(
  def: SkillDef,
  rank: number,
  attacker: Combatant,
  defender: Combatant,
): SkillDamageResult {
  if (def.kind !== "damage" && def.kind !== "areaDamage") {
    throw new Error(`"${def.id}" is not a damage skill (kind: ${def.kind}).`);
  }
  const multiplier = valueForRank(def, rank);
  const damage = multiplier * basicHitDamage(attacker, defender, def.element);
  defender.takeDamage(damage);
  return {
    skillId: def.id,
    kind: def.kind,
    damage,
    defeated: defender.currentHP <= 0,
    element: def.element,
  };
}

/**
 * Resolve a debuff skill (provoke): applies a **permanent** negative modifier to
 * the target via its `BuffTracker`. "Lasts forever" → `duration: Infinity`,
 * which never decrements to `≤ 0` (so `BuffTracker.advance` never expires it).
 */
export function resolveDebuff(
  def: SkillDef,
  rank: number,
  targetBuffs: BuffTracker,
): void {
  if (def.kind !== "debuff") {
    throw new Error(`"${def.id}" is not a debuff skill (kind: ${def.kind}).`);
  }
  targetBuffs.apply(buildDebuff(def, rank));
}

/** The permanent debuff a provoke rank applies (a signed `damageReduction` flat). */
export function buildDebuff(def: SkillDef, rank: number): BuffDef {
  return {
    id: def.id,
    name: def.name,
    duration: Infinity,
    modifiers: [
      {
        attribute: "damageReduction",
        kind: "flat",
        value: valueForRank(def, rank),
      },
    ],
  };
}

/**
 * Resolve a buff skill (raise-shield): applies a charge-based self buff that
 * sets `blockChance` to 100% (flat `+1`, clamped to 1) for the next N hits.
 */
export function resolveBuff(
  def: SkillDef,
  rank: number,
  charges: ChargeTracker,
): void {
  if (def.kind !== "buff") {
    throw new Error(`"${def.id}" is not a buff skill (kind: ${def.kind}).`);
  }
  charges.apply(buildChargeBuff(def, rank));
}

/** The charge buff a raise-shield rank applies (N charges of `blockChance` → 100%). */
export function buildChargeBuff(def: SkillDef, rank: number): ChargeBuffDef {
  return {
    id: def.id,
    name: def.name,
    charges: valueForRank(def, rank),
    modifiers: [{ attribute: "blockChance", kind: "flat", value: 1 }],
  };
}
