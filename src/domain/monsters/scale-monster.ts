import { ELEMENT_DAMAGE_STAT } from "../combat";
import type { Combatant, DamageElement } from "../combat";
import type { Stat } from "../stats";
import { defaultStat } from "../stats";
import type { MonsterDef, MonsterStatBlock } from "./monster-def";

/**
 * Boss multipliers — "a normal monster with higher stats" (overview), split into
 * a **defensive** and an **offensive** factor.
 *
 * Damage is multiplicative (`attack × flatDamage`), so a single multiplier applied
 * to *both* offensive stats squares into the hit (×3 → ×9 damage), which one-shots
 * a fresh hero and turns every boss into a binary burst race (D-041 follow-up).
 * Keeping bosses **tanky** (full multiplier on hp/armor) while **taming their
 * burst** (a gentler multiplier on attack/flatDamage) makes a boss a survivable
 * damage-sponge a starter-geared hero can out-trade.
 */
export const BOSS_HP_MULTIPLIER = 3;
/** Offensive multiplier (attack + flat damage) — see {@link BOSS_HP_MULTIPLIER}. */
export const BOSS_DAMAGE_MULTIPLIER = 1.5;

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
  /** Defensive multiplier (hp + armor), applied before flooring. Default 1. */
  readonly statMultiplier?: number;
  /**
   * Offensive multiplier (attack + flat damage), applied before flooring.
   * Defaults to `statMultiplier` so normal monsters scale uniformly; bosses
   * pass a gentler value to avoid the squared-burst one-shot (D-041).
   */
  readonly offensiveMultiplier?: number;
}

/**
 * Scale a monster archetype to a stage's monster `level`.
 *
 * Linear, deterministic (no rng — variance deferred, D-021):
 *   stat(L) = floor((base + perLevel × (L − 1)) × multiplier)
 *
 * Defensive stats (hp, armor) use `statMultiplier`; offensive stats (attack,
 * flatDamage) use `offensiveMultiplier`. The `flatDamage` is routed into the
 * stat for the **resolved** element, so the same archetype deals physical in
 * act 1 and its preferred element once the act allows it.
 */
export function scaleMonster(
  def: MonsterDef,
  level: number,
  allowedElements: readonly DamageElement[],
  {
    statMultiplier = 1,
    offensiveMultiplier = statMultiplier,
  }: ScaleMonsterOptions = {},
): Monster {
  assertValidLevel(level);

  const at = (key: keyof MonsterStatBlock, multiplier: number): number =>
    Math.floor(
      (def.baseStats[key] + def.perLevelGains[key] * (level - 1)) * multiplier,
    );

  const element = resolveElement(def, allowedElements);
  const stats: Partial<Record<Stat, number>> = {
    hp: at("hp", statMultiplier),
    attack: at("attack", offensiveMultiplier),
    armor: at("armor", statMultiplier),
    [ELEMENT_DAMAGE_STAT[element]]: at("flatDamage", offensiveMultiplier),
  };

  return new Monster(def.name, stats, element);
}

/**
 * A boss: a normal monster made **tanky** (`BOSS_HP_MULTIPLIER` on hp/armor) but
 * with only **moderately** higher burst (`BOSS_DAMAGE_MULTIPLIER` on offense).
 */
export function scaleBoss(
  def: MonsterDef,
  level: number,
  allowedElements: readonly DamageElement[],
): Monster {
  return scaleMonster(def, level, allowedElements, {
    statMultiplier: BOSS_HP_MULTIPLIER,
    offensiveMultiplier: BOSS_DAMAGE_MULTIPLIER,
  });
}
