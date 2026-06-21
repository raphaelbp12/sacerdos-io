/**
 * Shared shape for a "spendable" build choice — a passive OR a skill.
 *
 * Both are nodes the player pours refundable skill points into. They share the
 * same allocation rules (band unlock + per-node max rank), so the skill-point
 * allocator can treat them uniformly (DRY). The difference is only in what a
 * rank *does*: a passive emits modifiers (M7); a skill resolves an ability (M8).
 */
export type Band = 1 | 2 | 3 | 4;

export interface ChoiceNode {
  readonly id: string;
  /** Which level-band (1–4) unlocks this node. */
  readonly band: Band;
  /** Maximum ranks that can be poured into this node. */
  readonly maxRank: number;
}

/** The character level at which `band` becomes available (1, 11, 21, 31). */
export function bandUnlockLevel(band: Band): number {
  return 10 * (band - 1) + 1;
}

/** The highest band a character of `level` has unlocked (1–4). */
export function unlockedBand(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error(`Level must be an integer >= 1 (got ${level}).`);
  }
  return Math.min(4, Math.ceil(level / 10));
}
