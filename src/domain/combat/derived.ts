/**
 * Derived calculations over canonical stats (M6).
 *
 * These are pure formulas — NOT a second stat system. They read final stat
 * values (already computed by getStat) and turn them into combat-meaningful
 * numbers. Tuning constants live here, in one place.
 */

import type { Stat } from "../stats";
import { hitDamageFromStats, type DamageElement } from "./damage";

/** Armor curve constant: armor === K yields 50% physical resist. (Roadmap §5 Q3.) */
export const ARMOR_K = 100;

/**
 * Time between basic attacks, in milliseconds, from attacks-per-second.
 * attackSpeed 1.0 → 1000 ms; 2.0 → 500 ms.
 */
export function timeBetweenAttacks(attackSpeed: number): number {
  return 1000 / attackSpeed;
}

/**
 * A skill's effective cooldown after cooldown reduction.
 * cdr is a fraction in [0, 1]; 0.2 on 3000 ms → 2400 ms.
 */
export function effectiveCooldown(
  baseMs: number,
  cooldownReduction: number,
): number {
  return baseMs * (1 - cooldownReduction);
}

/**
 * Physical damage resistance derived from armor, as a fraction in [0, 1).
 * Diminishing returns: resist = armor / (armor + K). Never reaches 1.0.
 *   armor   0 → 0
 *   armor 100 → 0.5
 *   armor 300 → 0.75
 */
export function physicalResist(armor: number): number {
  if (armor <= 0) return 0;
  return armor / (armor + ARMOR_K);
}

/** Maximum HP is simply the final `hp` stat. */
export function maxHP(getStat: (stat: "hp") => number): number {
  return getStat("hp");
}

/**
 * Basic-attack DPS (M25): raw hit damage × attacks per second. A thin composition
 * of {@link hitDamageFromStats} and the `attackSpeed` stat — no formula is duplicated.
 *   attack 10, physicalDamage 5, damage 0, attackSpeed 1 → 50 DPS
 *   same with attackSpeed 2 → 100 DPS
 */
export function dps(
  getStat: (stat: Stat) => number,
  element: DamageElement = "physical",
): number {
  return hitDamageFromStats(getStat, element) * getStat("attackSpeed");
}

/**
 * Effective HP vs. physical hits (M25): `hp / (1 − physicalResist(armor))`. Armor makes
 * each point of HP soak more raw damage, so EHP ≥ raw HP and grows as armor rises.
 *   hp 100, armor 0   → 100
 *   hp 100, armor 100 → 200 (50% resist)
 */
export function effectiveHP(getStat: (stat: Stat) => number): number {
  return getStat("hp") / (1 - physicalResist(getStat("armor")));
}

/**
 * Estimated seconds for `attacker` to kill `defender` with basic attacks (M25):
 * `effectiveHP(defender) / dps(attacker)`. Returns `Infinity` when the attacker deals
 * no damage. Consistent with mitigated DPS since EHP folds in the defender's resist.
 */
export function timeToKill(
  attackerStat: (stat: Stat) => number,
  defenderStat: (stat: Stat) => number,
): number {
  const outgoing = dps(attackerStat);
  if (outgoing <= 0) return Infinity;
  return effectiveHP(defenderStat) / outgoing;
}
