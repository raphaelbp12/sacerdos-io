import type { Modifier, ModifierSource } from "../stats/modifier";
import type { Clock } from "../clock/clock";

/**
 * Pure-data definition for a timed buff.
 * Defined once; referenced by items, skills, or any other source.
 */
export interface BuffDef {
  readonly id: string;
  readonly name: string;
  /** Duration in abstract time units (advanced by the caller via Clock.advance). */
  readonly duration: number;
  readonly modifiers: readonly Modifier[];
}

/** Internal runtime state for a single active buff. */
class ActiveBuff {
  declare remaining: number;

  constructor(readonly def: BuffDef) {
    this.remaining = def.duration;
  }

  refresh(): void {
    this.remaining = this.def.duration;
  }

  advance(amount: number): void {
    this.remaining -= amount;
  }

  get isExpired(): boolean {
    return this.remaining <= 0;
  }
}

/**
 * Tracks active timed buffs for a character.
 *
 * Implements ModifierSource so it can be passed directly to Character as a stat source.
 * Implements Clock so callers advance time through a single surface.
 *
 * Stacking rule (locked): refresh — re-applying an active buff resets its timer.
 */
export class BuffTracker implements ModifierSource, Clock {
  declare private readonly active: Map<string, ActiveBuff>;

  constructor() {
    this.active = new Map();
  }

  /** Apply a buff. If already active, refreshes its remaining duration. */
  apply(def: BuffDef): void {
    const existing = this.active.get(def.id);
    if (existing) {
      existing.refresh();
    } else {
      this.active.set(def.id, new ActiveBuff(def));
    }
  }

  /** Advance time by `amount` units; expired buffs are removed automatically. */
  advance(amount: number): void {
    for (const [id, buff] of this.active) {
      buff.advance(amount);
      if (buff.isExpired) this.active.delete(id);
    }
  }

  /** Implements ModifierSource — aggregates modifiers from all active buffs. */
  getModifiers(): readonly Modifier[] {
    const result: Modifier[] = [];
    for (const buff of this.active.values()) {
      result.push(...buff.def.modifiers);
    }
    return result;
  }

  /** Returns a snapshot of currently active buffs with their remaining time. */
  getActiveBuffs(): readonly { def: BuffDef; remaining: number }[] {
    return [...this.active.values()].map((b) => ({
      def: b.def,
      remaining: b.remaining,
    }));
  }
}
