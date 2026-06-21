/**
 * Basic-attack damage formula (M6), over **final** stat values.
 *
 * The overview's formula, applied to stats that getStat has already resolved
 * (flat + percentage baked in), collapses to:
 *
 *   finalDamage = attack × <elementDamage> × (1 + damage)
 *
 * where `<elementDamage>` is the element's flat-damage stat and `damage` is the
 * additive "% increased damage" fraction. Because getStat already folds each
 * stat's own percentage modifiers into its value, no per-stat `(1+pct)` factors
 * appear here — they are already inside `attack` and `<elementDamage>`.
 */

import type { Stat } from "../stats";

/** Damage elements a hit can deal. Basic attacks are `physical`. */
export type DamageElement =
  | "physical"
  | "fire"
  | "cold"
  | "lightning"
  | "chaos";

/** Maps each element to the canonical flat-damage stat it scales with. */
export const ELEMENT_DAMAGE_STAT: Readonly<Record<DamageElement, Stat>> = {
  physical: "physicalDamage",
  fire: "fireDamage",
  cold: "coldDamage",
  lightning: "lightningDamage",
  chaos: "chaosDamage",
};

/** The three final-stat inputs a single hit's damage depends on. */
export interface HitDamageInputs {
  /** Final `attack` stat. */
  attack: number;
  /** Final element-damage stat for the hit's element. */
  flatDamage: number;
  /** Final `damage` stat — additive "% increased damage" as a fraction. */
  damagePercent: number;
}

/**
 * Raw (pre-mitigation) damage of one hit from already-final stat values.
 *   attack 10, flatDamage 5, damagePercent 0 → 50
 *   damagePercent 0.5 → 75
 */
export function computeHitDamage({
  attack,
  flatDamage,
  damagePercent,
}: HitDamageInputs): number {
  return attack * flatDamage * (1 + damagePercent);
}

/**
 * Convenience: pull the inputs for `element` out of a getStat reader and
 * compute the raw hit damage. Basic attacks pass `element = "physical"`.
 */
export function hitDamageFromStats(
  getStat: (stat: Stat) => number,
  element: DamageElement = "physical",
): number {
  return computeHitDamage({
    attack: getStat("attack"),
    flatDamage: getStat(ELEMENT_DAMAGE_STAT[element]),
    damagePercent: getStat("damage"),
  });
}
