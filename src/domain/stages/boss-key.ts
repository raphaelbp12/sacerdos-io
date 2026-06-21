/**
 * Boss keys (M11): the act boss is gated by a `BossKey` for that act. The key is
 * **consumed only if the boss fight dropped something** — if nothing drops, the
 * key is kept (overview).
 *
 * Keys are non-stackable (one slot each); the inventory-capacity side of that is
 * M15. This module models only the gate + consumption rule as pure functions
 * over a key list.
 */

export interface BossKey {
  /** 1-based index of the act this key opens. */
  readonly actIndex: number;
}

export function makeBossKey(actIndex: number): BossKey {
  return { actIndex };
}

/** Whether the player holds a key for the given act. */
export function hasBossKeyFor(
  keys: readonly BossKey[],
  actIndex: number,
): boolean {
  return keys.some((k) => k.actIndex === actIndex);
}

/**
 * Resolve the key list after an act-boss fight: consume **one** key for the act
 * iff the fight dropped loot; otherwise return the list unchanged. Keys for
 * other acts are never touched.
 */
export function settleBossKeyAfterFight(
  keys: readonly BossKey[],
  actIndex: number,
  droppedSomething: boolean,
): BossKey[] {
  if (!droppedSomething) return [...keys];

  const consumeIndex = keys.findIndex((k) => k.actIndex === actIndex);
  if (consumeIndex === -1) return [...keys];

  return keys.filter((_, i) => i !== consumeIndex);
}
