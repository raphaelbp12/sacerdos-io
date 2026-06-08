import type { Modifier } from './modifier';

/**
 * Computes the final value for a single attribute given its base value and a list of
 * pre-filtered modifiers (all belonging to the same attribute).
 *
 * Locked order of operations (do not change):
 *   1. Sum all FLAT modifiers.
 *   2. Multiply by the product of (1 + value) for each PERCENTAGE modifier.
 *
 * This function is pure: no side effects, deterministic, no attribute identity knowledge.
 */
export function computeStat(base: number, modifiers: readonly Modifier[]): number {
  const flat = modifiers
    .filter((m) => m.kind === 'flat')
    .reduce((sum, m) => sum + m.value, 0);

  const afterFlat = base + flat;

  const percentMultiplier = modifiers
    .filter((m) => m.kind === 'percentage')
    .reduce((product, m) => product * (1 + m.value), 1);

  return afterFlat * percentMultiplier;
}
