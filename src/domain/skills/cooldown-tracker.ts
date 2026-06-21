import type { Clock } from "../clock";
import { effectiveCooldown } from "../combat";

/**
 * Per-skill cooldown timers (M8), advanced by an injected `Clock` in
 * milliseconds — no wall-clock reads.
 *
 * Stores only the deliberately-stateful remaining time per skill id. A skill is
 * "ready" when its remaining time is `≤ 0` (or it has never been used).
 *
 * Resolution and cooldown are intentionally separate (SRP): a caller checks
 * `isReady`, resolves the skill elsewhere, then calls `use`.
 */
export class CooldownTracker implements Clock {
  private readonly remaining = new Map<string, number>();

  /** Whether `skillId` can be used right now. */
  isReady(skillId: string): boolean {
    return this.remainingFor(skillId) <= 0;
  }

  /** Milliseconds left before `skillId` is ready (0 if ready). */
  remainingFor(skillId: string): number {
    return Math.max(0, this.remaining.get(skillId) ?? 0);
  }

  /**
   * Puts `skillId` on cooldown. `cooldownReduction` (a fraction in [0,1])
   * shortens the wait via `effectiveCooldown`. Throws if not ready.
   */
  use(skillId: string, baseCooldownMs: number, cooldownReduction = 0): void {
    if (!this.isReady(skillId)) {
      throw new Error(
        `"${skillId}" is on cooldown (${this.remainingFor(skillId)} ms left).`,
      );
    }
    this.remaining.set(
      skillId,
      effectiveCooldown(baseCooldownMs, cooldownReduction),
    );
  }

  /** Advances all cooldowns by `deltaMs`; ready skills are pruned. */
  advance(deltaMs: number): void {
    for (const [id, left] of this.remaining) {
      const next = left - deltaMs;
      if (next <= 0) {
        this.remaining.delete(id);
      } else {
        this.remaining.set(id, next);
      }
    }
  }
}
