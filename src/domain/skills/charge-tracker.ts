import type { Modifier, ModifierSource } from "../stats";

/**
 * Pure-data definition of a charge-based buff — a buff that lasts for the next
 * N actions instead of a span of time (e.g. raise-shield: "block the next 5
 * hits"). Mirrors `BuffDef` but counts charges, not milliseconds.
 */
export interface ChargeBuffDef {
  readonly id: string;
  readonly name: string;
  /** Number of consumptions before the buff expires. */
  readonly charges: number;
  readonly modifiers: readonly Modifier[];
}

interface ActiveCharge {
  readonly def: ChargeBuffDef;
  remaining: number;
}

/**
 * Tracks charge-based buffs for a holder (M8).
 *
 * A sibling to `BuffTracker` kept deliberately separate (SRP): timed buffs
 * advance on a `Clock`; charge buffs advance on actions via `consume()`.
 * Implements `ModifierSource`, so a `Character` reflects the buff on the next
 * `getStat()` and drops it automatically once charges hit zero.
 *
 * Stacking rule (matches `BuffTracker`): re-applying an active buff refreshes
 * its charge count.
 */
export class ChargeTracker implements ModifierSource {
  private readonly active = new Map<string, ActiveCharge>();

  /** Apply a charge buff. If already active, refreshes its charges. */
  apply(def: ChargeBuffDef): void {
    const existing = this.active.get(def.id);
    if (existing) {
      existing.remaining = def.charges;
    } else {
      this.active.set(def.id, { def, remaining: def.charges });
    }
  }

  /** Consumes one charge from every active buff; expired buffs are removed. */
  consume(): void {
    for (const [id, charge] of this.active) {
      charge.remaining -= 1;
      if (charge.remaining <= 0) this.active.delete(id);
    }
  }

  /** Charges left on `id` (0 if not active). */
  remainingCharges(id: string): number {
    return this.active.get(id)?.remaining ?? 0;
  }

  /** Implements `ModifierSource` — modifiers from all active charge buffs. */
  getModifiers(): readonly Modifier[] {
    const result: Modifier[] = [];
    for (const charge of this.active.values()) {
      result.push(...charge.def.modifiers);
    }
    return result;
  }

  /** Snapshot of active charge buffs with their remaining charges. */
  getActive(): readonly { def: ChargeBuffDef; remaining: number }[] {
    return [...this.active.values()].map((c) => ({
      def: c.def,
      remaining: c.remaining,
    }));
  }
}
