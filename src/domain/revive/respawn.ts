import type { Clock } from "../clock";
import { BASE_RESPAWN_MS, MIN_RESPAWN_MS } from "./tuning";

/**
 * The minimal surface the respawn system needs (M12).
 *
 * We depend on this contract, never on the concrete `Character`/`Monster`, so any
 * HP-holder plugs in. "Downed" is derived from `currentHP`, consistent with the
 * `isAlive = currentHP > 0` rule used elsewhere. `revive()` restores to full HP.
 */
export interface Revivable {
  readonly currentHP: number;
  revive(): void;
}

/** Whether a member has been knocked out (HP at or below 0). */
export function isDowned(unit: Revivable): boolean {
  return unit.currentHP <= 0;
}

/** A respawn-shortening effect: a flat ms shave then a fractional reduction. */
export interface RespawnReduction {
  /** Milliseconds shaved off before the percentage applies. */
  readonly flatMs?: number;
  /** Fractional reduction in `[0, 1]` applied after the flat shave. */
  readonly percent?: number;
}

/**
 * The effective respawn wait after reductions. Flat first, then percent — the
 * same order as the stat engine's `(base + Σflat) × Π(1+%)` (here, shortening).
 * Floored at {@link MIN_RESPAWN_MS}.
 */
export function effectiveRespawnMs(reduction: RespawnReduction = {}): number {
  const flatMs = reduction.flatMs ?? 0;
  const percent = reduction.percent ?? 0;
  const reduced = (BASE_RESPAWN_MS - flatMs) * (1 - percent);
  return Math.max(MIN_RESPAWN_MS, reduced);
}

interface RespawnEntry {
  readonly unit: Revivable;
  remainingMs: number;
}

/**
 * Tracks downed members and revives them when their `Clock`-driven timer expires
 * (M12). It owns the only deliberately-stateful bit — `remainingMs` per unit.
 *
 * Deciding that a unit died lives in the battle layer; this queue only models the
 * wait, mirroring how `CooldownTracker` is separate from skill resolution (SRP).
 */
export class RespawnQueue implements Clock {
  private readonly entries: RespawnEntry[] = [];

  /** How many members are currently waiting to respawn. */
  get pendingCount(): number {
    return this.entries.length;
  }

  /** Whether `unit` is currently waiting to respawn. */
  isPending(unit: Revivable): boolean {
    return this.entries.some((e) => e.unit === unit);
  }

  /** Milliseconds left before `unit` revives (0 if it is not queued). */
  remainingFor(unit: Revivable): number {
    const entry = this.entries.find((e) => e.unit === unit);
    return entry ? Math.max(0, entry.remainingMs) : 0;
  }

  /**
   * Starts `unit`'s respawn timer. Idempotent: a unit already waiting is not
   * re-queued (its existing timer keeps running).
   */
  down(unit: Revivable, reduction?: RespawnReduction): void {
    if (this.isPending(unit)) return;
    this.entries.push({ unit, remainingMs: effectiveRespawnMs(reduction) });
  }

  /**
   * Advances every pending timer by `deltaMs`. Any timer that reaches 0 revives
   * its member (full HP) and is removed from the queue.
   */
  advance(deltaMs: number): void {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      entry.remainingMs -= deltaMs;
      if (entry.remainingMs <= 0) {
        entry.unit.revive();
        this.entries.splice(i, 1);
      }
    }
  }
}
