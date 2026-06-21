import {
  INSTANT_REVIVE_BASE_COST,
  INSTANT_REVIVE_COST_PER_LEVEL,
} from "./tuning";

/**
 * Placeholder cost in gold to instantly revive a member instead of waiting out
 * its respawn timer (M12). The shape (scales with level) exists so the "spend to
 * skip" hook is wired now; the actual pricing/balancing is deferred (D-017).
 */
export function instantReviveCost(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error(`level must be a positive integer, got ${level}.`);
  }
  return INSTANT_REVIVE_BASE_COST + INSTANT_REVIVE_COST_PER_LEVEL * (level - 1);
}
