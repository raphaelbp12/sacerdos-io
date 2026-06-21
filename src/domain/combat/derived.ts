/**
 * Derived calculations over canonical stats (M6).
 *
 * These are pure formulas — NOT a second stat system. They read final stat
 * values (already computed by getStat) and turn them into combat-meaningful
 * numbers. Tuning constants live here, in one place.
 */

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
