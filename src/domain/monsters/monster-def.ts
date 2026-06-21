import type { DamageElement } from "../combat";

/**
 * The neutral stat block a monster needs to fight.
 *
 * `flatDamage` is element-agnostic: `scaleMonster` routes it into whichever
 * element the monster ends up dealing (see `MonsterDef.preferredElement` and
 * the act's `allowedElements`). The other fields map 1:1 onto canonical stats.
 */
export interface MonsterStatBlock {
  /** Hit-point pool (also the monster's starting `currentHP`). */
  readonly hp: number;
  /** Base of the damage formula. */
  readonly attack: number;
  /** Physical-resist source when defending. */
  readonly armor: number;
  /** Flat element/physical damage, routed to the resolved element's stat. */
  readonly flatDamage: number;
}

/**
 * A monster archetype — a **data row**, not a subclass (data-not-code).
 *
 * Stats scale linearly with the stage's monster level, mirroring the class
 * table: `stat(L) = baseStats + perLevelGains × (L − 1)`.
 */
export interface MonsterDef {
  /** Unique id across `MONSTER_BASES`. */
  readonly id: string;
  /** Display name, for combat logs. */
  readonly name: string;
  /** Stat block at monster level 1. */
  readonly baseStats: MonsterStatBlock;
  /** Per-level additions beyond level 1. */
  readonly perLevelGains: MonsterStatBlock;
  /**
   * The element this monster *wants* to deal. It is used only when the act's
   * `allowedElements` permits it; otherwise the monster falls back to physical.
   */
  readonly preferredElement: DamageElement;
}
