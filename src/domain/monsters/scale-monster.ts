import { ELEMENT_DAMAGE_STAT } from "../combat";
import type { Combatant, DamageElement } from "../combat";
import type { Stat } from "../stats";
import { defaultStat } from "../stats";
import type { MonsterDef, MonsterStatBlock } from "./monster-def";

/** Boss stat multiplier — "a normal monster with higher stats" (overview). */
export const BOSS_STAT_MULTIPLIER = 3;

/**
 * A scaled, fightable monster implementing the `Combatant` contract (M6), so it
 * plugs into `resolveAttack` as attacker or defender with no combat changes.
 *
 * The scaled stat record is the monster's *base* (the analogue of a character's
 * class+level base); only `currentHP` is deliberately stateful.
 */
export class Monster implements Combatant {
  readonly name: string;
  /** The element this monster deals (resolved against the act). */
  readonly element: DamageElement;
  private readonly stats: Readonly<Partial<Record<Stat, number>>>;
  private _currentHP: number;

  constructor(
    name: string,
    stats: Readonly<Partial<Record<Stat, number>>>,
    element: DamageElement,
  ) {
    this.name = name;
    this.stats = stats;
    this.element = element;
    this._currentHP = this.getStat("hp");
  }

  getStat(stat: Stat): number {
    return this.stats[stat] ?? defaultStat(stat);
  }

  get currentHP(): number {
    return this._currentHP;
  }

  takeDamage(amount: number): void {
    this._currentHP = Math.max(0, this._currentHP - amount);
  }

  /** Restore the monster to full HP. */
  reset(): void {
    this._currentHP = this.getStat("hp");
  }
}

function assertValidLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error(`monster level must be an integer >= 1, got ${level}`);
  }
}

/** Resolve the element a monster deals: its preferred one if the act allows it. */
function resolveElement(
  def: MonsterDef,
  allowedElements: readonly DamageElement[],
): DamageElement {
  return allowedElements.includes(def.preferredElement)
    ? def.preferredElement
    : "physical";
}

export interface ScaleMonsterOptions {
  /** Stat multiplier applied before flooring (bosses pass > 1). Default 1. */
  readonly statMultiplier?: number;
}

/**
 * Scale a monster archetype to a stage's monster `level`.
 *
 * Linear, deterministic (no rng — variance deferred, D-021):
 *   stat(L) = floor((base + perLevel × (L − 1)) × statMultiplier)
 *
 * The monster's `flatDamage` is routed into the stat for the **resolved**
 * element, so the same archetype deals physical in act 1 and its preferred
 * element once the act allows it.
 */
export function scaleMonster(
  def: MonsterDef,
  level: number,
  allowedElements: readonly DamageElement[],
  { statMultiplier = 1 }: ScaleMonsterOptions = {},
): Monster {
  assertValidLevel(level);

  const at = (key: keyof MonsterStatBlock): number =>
    Math.floor(
      (def.baseStats[key] + def.perLevelGains[key] * (level - 1)) *
        statMultiplier,
    );

  const element = resolveElement(def, allowedElements);
  const stats: Partial<Record<Stat, number>> = {
    hp: at("hp"),
    attack: at("attack"),
    armor: at("armor"),
    [ELEMENT_DAMAGE_STAT[element]]: at("flatDamage"),
  };

  return new Monster(def.name, stats, element);
}

/** A boss: a normal monster scaled with `BOSS_STAT_MULTIPLIER` higher stats. */
export function scaleBoss(
  def: MonsterDef,
  level: number,
  allowedElements: readonly DamageElement[],
): Monster {
  return scaleMonster(def, level, allowedElements, {
    statMultiplier: BOSS_STAT_MULTIPLIER,
  });
}
