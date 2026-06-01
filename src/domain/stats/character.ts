import type { Attribute } from "./attribute";
import type { ModifierSource } from "./modifier";
import { computeStat } from "./compute-stat";

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
  declare private readonly baseStats: Readonly<Record<Attribute, number>>;
  declare private readonly sources: readonly ModifierSource[];
  declare readonly level: number;

  constructor(
    baseStats: Readonly<Record<Attribute, number>>,
    sources: readonly ModifierSource[] = [],
    level: number = 1,
  ) {
    this.baseStats = baseStats;
    this.sources = sources;
    this.level = level;
  }

  getStat(attribute: Attribute): number {
    const base = this.baseStats[attribute];
    const modifiers = this.sources
      .flatMap((s) => s.getModifiers())
      .filter((m) => m.attribute === attribute);
    return computeStat(base, modifiers);
  }
}
