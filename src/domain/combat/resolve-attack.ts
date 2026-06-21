/**
 * Resolve a single basic attack from one combatant against another (M6).
 *
 * Order (overview "defense / damage-taken order"):
 *   1. dodge, then block — physical only, each a chance to avoid the hit (0 dmg).
 *      Rng order is LOCKED: dodge roll first, then block roll, both via nextFloat().
 *   2. otherwise: computeHitDamage → mitigate (reduction → armor/resist →
 *      absorption → min-1 floor) → defender.takeDamage.
 *
 * Pure except for the injected `Rng` and the defender's HP mutation. No
 * Math.random(), no wall-clock.
 */

import type { Rng } from "../rng";
import type { Stat } from "../stats";
import type { Combatant } from "./combatant";
import { hitDamageFromStats } from "./damage";
import type { DamageElement } from "./damage";
import { mitigate } from "./mitigation";
import type { DefenseInputs } from "./mitigation";

/** Maps a non-physical element to the defender's resist stat. */
export const ELEMENT_RESIST_STAT: Readonly<
  Record<Exclude<DamageElement, "physical">, Stat>
> = {
  fire: "fireResist",
  cold: "coldResist",
  lightning: "lightningResist",
  chaos: "chaosResist",
};

export interface AttackResult {
  /** Damage actually dealt (0 if avoided). */
  damage: number;
  /** Whether the hit was blocked (physical only). */
  blocked: boolean;
  /** Whether the hit was dodged (physical only). */
  dodged: boolean;
  /** Whether the defender is at 0 HP after the hit. */
  defeated: boolean;
  /** The element of this hit. */
  element: DamageElement;
}

function defenseFor(
  defender: Combatant,
  element: DamageElement,
): DefenseInputs {
  return {
    damageReduction: defender.getStat("damageReduction"),
    armor: defender.getStat("armor"),
    resist:
      element === "physical"
        ? 0
        : defender.getStat(ELEMENT_RESIST_STAT[element]),
    absorption: defender.getStat("damageAbsorption"),
  };
}

export function resolveAttack(
  attacker: Combatant,
  defender: Combatant,
  rng: Rng,
  element: DamageElement = "physical",
): AttackResult {
  // 1. Avoidance — physical only. Dodge first, then block (locked rng order).
  if (element === "physical") {
    if (rng.nextFloat() < defender.getStat("dodgeChance")) {
      return {
        damage: 0,
        blocked: false,
        dodged: true,
        defeated: defender.currentHP <= 0,
        element,
      };
    }
    if (rng.nextFloat() < defender.getStat("blockChance")) {
      return {
        damage: 0,
        blocked: true,
        dodged: false,
        defeated: defender.currentHP <= 0,
        element,
      };
    }
  }

  // 2. Damage → mitigation → apply.
  const raw = hitDamageFromStats((stat) => attacker.getStat(stat), element);
  const damage = mitigate(raw, element, defenseFor(defender, element));
  defender.takeDamage(damage);

  return {
    damage,
    blocked: false,
    dodged: false,
    defeated: defender.currentHP <= 0,
    element,
  };
}
