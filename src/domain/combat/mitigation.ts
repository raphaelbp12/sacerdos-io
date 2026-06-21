/**
 * Damage-taken mitigation pipeline (M6).
 *
 * The overview's defense order, applied to a hit that was NOT avoided
 * (block/dodge live in resolve-attack, since they zero the hit entirely):
 *
 *   1. damage reduction %  — percentage off the remaining damage
 *   2. armor (physical) / element resist — percentage off, derived per element
 *   3. damage absorption   — flat subtraction
 *   4. floor               — received damage is at minimum 1
 *
 * Each layer is a tiny pure function (SRP/OCP): a new layer can be inserted
 * without editing the others. `mitigate` composes them in order.
 */

import { physicalResist } from "./derived";
import type { DamageElement } from "./damage";

/** The defender stat values the mitigation pipeline reads. */
export interface DefenseInputs {
  /** `damageReduction` fraction in [0, 1]. */
  damageReduction: number;
  /** `armor` value (drives physical resist via the armor curve). */
  armor: number;
  /** Per-element resist fraction in [0, 1] for the hit's element. */
  resist: number;
  /** `damageAbsorption` flat value. */
  absorption: number;
}

/** Layer 1: percentage damage reduction. */
export function applyDamageReduction(
  damage: number,
  reduction: number,
): number {
  return damage * (1 - reduction);
}

/** Layer 2 (physical): armor reduces damage via the physical-resist curve. */
export function applyArmor(damage: number, armor: number): number {
  return damage * (1 - physicalResist(armor));
}

/** Layer 2 (element): a flat resist fraction reduces damage. */
export function applyResist(damage: number, resist: number): number {
  return damage * (1 - resist);
}

/** Layer 3: flat damage absorption. */
export function applyAbsorption(damage: number, absorption: number): number {
  return damage - absorption;
}

/** Layer 4: received damage is at minimum 1. */
export function floorDamage(damage: number): number {
  return Math.max(1, damage);
}

/**
 * Compose the layers in the overview's order for one (already non-avoided) hit.
 * Physical hits use armor; elemental hits use that element's resist.
 */
export function mitigate(
  raw: number,
  element: DamageElement,
  defense: DefenseInputs,
): number {
  let dmg = applyDamageReduction(raw, defense.damageReduction);
  dmg =
    element === "physical"
      ? applyArmor(dmg, defense.armor)
      : applyResist(dmg, defense.resist);
  dmg = applyAbsorption(dmg, defense.absorption);
  return floorDamage(dmg);
}
