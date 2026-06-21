/**
 * A combatant placed on the battlefield (M10).
 *
 * Wraps a `Combatant` with the deliberately-stateful battle data — its `side`,
 * position `x`, basic-attack timer, and a per-unit skill `CooldownTracker`.
 * Stats still come from `combatant.getStat` (compute-don't-store); only the
 * position and timers are stored here.
 */

import { timeBetweenAttacks } from "../combat";
import type { Combatant, DamageElement } from "../combat";
import { CooldownTracker } from "../skills";
import type { SkillDef } from "../skills";
import type { Side } from "./battlefield";
import { BASIC_ATTACK_RANGE } from "./tuning";

/** A skill the unit knows, at a chosen rank. */
export interface SkillLoadoutEntry {
  readonly def: SkillDef;
  readonly rank: number;
}

export class BattleUnit {
  readonly combatant: Combatant;
  readonly side: Side;
  /** Position on the 1D line. */
  x: number;
  /** Milliseconds until the next basic attack lands (counts down in range). */
  attackTimerMs: number;
  /** Distance at which the unit stops advancing (its basic-attack range). */
  readonly engageRange: number;
  /** Element of this unit's basic attacks (monsters may deal an element). */
  readonly attackElement: DamageElement;
  /** Damage skills the unit may auto-cast (buff/debuff skills are inert — D-023). */
  readonly skills: readonly SkillLoadoutEntry[];
  /** Per-unit skill cooldown timers, advanced each tick. */
  readonly cooldowns: CooldownTracker;

  constructor(
    combatant: Combatant,
    side: Side,
    x: number,
    skills: readonly SkillLoadoutEntry[] = [],
    attackElement: DamageElement = "physical",
  ) {
    this.combatant = combatant;
    this.side = side;
    this.x = x;
    this.skills = skills;
    this.attackElement = attackElement;
    this.engageRange = BASIC_ATTACK_RANGE;
    this.cooldowns = new CooldownTracker();
    this.attackTimerMs = this.basicAttackInterval();
  }

  get name(): string {
    return this.combatant.name;
  }

  get isAlive(): boolean {
    return this.combatant.currentHP > 0;
  }

  /** Milliseconds between basic attacks, from the unit's current attack speed. */
  basicAttackInterval(): number {
    return timeBetweenAttacks(this.combatant.getStat("attackSpeed"));
  }
}
