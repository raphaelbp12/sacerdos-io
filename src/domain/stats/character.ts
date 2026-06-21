import type { Stat } from "./stat";
import { defaultStat, clampStat } from "./stat";
import type { ModifierSource } from "./modifier";
import { computeStat } from "./compute-stat";
import { BuffTracker } from "../effects/buff";
import type { Item } from "../items/item";

/**
 * Stat-holder for a character.
 *
 * Design rules:
 * - There is NO stored "current stat" field. getStat() derives values on every read.
 * - Modifiers are collected from ModifierSource objects (equipped items, active buffs).
 *   Because sources are held by reference, equipping/unequipping updates stats
 *   automatically on the next getStat() call — no manual invalidation needed.
 * - Zero React / DOM / Vite imports.
 */
export class Character {
  declare private readonly baseStats: Readonly<Partial<Record<Stat, number>>>;
  declare private readonly sources: readonly ModifierSource[];
  declare private readonly buffs: BuffTracker;
  declare private _currentHP: number;
  declare readonly level: number;

  constructor(
    baseStats: Readonly<Partial<Record<Stat, number>>>,
    sources: readonly ModifierSource[] = [],
    level: number = 1,
    buffs?: BuffTracker,
  ) {
    this.baseStats = baseStats;
    this.sources = sources;
    this.level = level;
    this.buffs = buffs ?? new BuffTracker();
    this._currentHP = this.getStat("hp");
  }

  get currentHP(): number {
    return this._currentHP;
  }

  getStat(stat: Stat): number {
    const base = this.baseStats[stat] ?? defaultStat(stat);
    const modifiers = [...this.sources, this.buffs]
      .flatMap((s) => s.getModifiers())
      .filter((m) => m.attribute === stat);
    return clampStat(stat, computeStat(base, modifiers));
  }

  /**
   * Reduces currentHP by `amount`, floored at 0.
   */
  takeDamage(amount: number): void {
    this._currentHP = Math.max(0, this._currentHP - amount);
  }

  /**
   * Applies all effects from a consumable item.
   * Throws if the item is not a consumable.
   */
  use(item: Item): void {
    if (item.kind !== "consumable") {
      throw new Error(
        `Item "${item.name}" is not usable (kind: ${item.kind}).`,
      );
    }
    for (const effect of item.instantEffects ?? []) {
      if (effect.type === "heal") {
        const maxHP = this.getStat("hp");
        this._currentHP = Math.min(this._currentHP + effect.amount, maxHP);
      }
    }
    if (item.buff) {
      this.buffs.apply(item.buff);
    }
  }

  /**
   * Advances time by `amount` units.
   * Expired buffs are pruned automatically.
   */
  advance(amount: number): void {
    this.buffs.advance(amount);
  }

  /** Returns a snapshot of currently active buffs with their remaining time. */
  getActiveBuffs(): ReturnType<BuffTracker["getActiveBuffs"]> {
    return this.buffs.getActiveBuffs();
  }
}
