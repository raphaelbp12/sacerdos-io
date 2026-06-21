/**
 * Combat participant contract (M6).
 *
 * `resolveAttack` depends on this interface, never on the concrete `Character`,
 * so a future enemy/monster type (D-009) plugs in without touching combat code.
 * It is the minimal surface a hit needs: read final stats, read/spend HP, name.
 */

import type { Stat } from "../stats";
import type { Character } from "../stats";

export interface Combatant {
  /** Display name, for combat logs. */
  readonly name: string;
  /** Final value of a canonical stat (default + clamp already applied). */
  getStat(stat: Stat): number;
  /** Remaining hit points. */
  readonly currentHP: number;
  /** Reduce currentHP by `amount` (implementations floor at 0). */
  takeDamage(amount: number): void;
}

/**
 * Adapt a `Character` to the `Combatant` contract by attaching a name.
 * Delegates live to the character so HP and stat changes stay in sync.
 */
export function asCombatant(character: Character, name: string): Combatant {
  return {
    name,
    getStat: (stat) => character.getStat(stat),
    get currentHP() {
      return character.currentHP;
    },
    takeDamage: (amount) => character.takeDamage(amount),
  };
}
