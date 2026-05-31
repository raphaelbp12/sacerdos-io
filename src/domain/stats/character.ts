import type { Attribute } from './attribute';
import type { Modifier } from './modifier';
import { computeStat } from './compute-stat';

/**
 * Minimal stat-holder (the seed of Character).
 *
 * Design rules:
 * - There is NO stored "current stat" field. getStat() derives values on every read.
 * - Modifiers are passed in directly for M1. In M2 they will be collected from
 *   ModifierSource objects (equipped items, active buffs) instead.
 * - Zero React / DOM / Vite imports.
 */
export class Character {
  constructor(
    private readonly baseStats: Readonly<Record<Attribute, number>>,
    private readonly modifiers: readonly Modifier[] = [],
  ) {}

  getStat(attribute: Attribute): number {
    const base = this.baseStats[attribute];
    const relevant = this.modifiers.filter((m) => m.attribute === attribute);
    return computeStat(base, relevant);
  }
}
