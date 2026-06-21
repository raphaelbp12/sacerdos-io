/**
 * XP on kill (M11) — delivers the rest of D-008.
 *
 * A kill's XP is split **equally among the living** group members; a member that
 * is dead when the kill happens earns nothing (overview). Bosses are worth more
 * than normal monsters.
 *
 * `levelForTotalXp` uses a simple **triangular** curve so accumulated XP is
 * usable; the actual curve is a placeholder to be balanced later (D-024).
 */

export type KillSource = "monster" | "stageBoss" | "actBoss";

/** Multiplier applied to a kill's base XP by its source. */
const SOURCE_MULTIPLIER: Readonly<Record<KillSource, number>> = {
  monster: 1,
  stageBoss: 10,
  actBoss: 50,
};

/** XP a single kill is worth, before being split among the group. */
export function xpForKill(source: KillSource, baseXp: number): number {
  return Math.floor(baseXp * SOURCE_MULTIPLIER[source]);
}

/** A group member as far as XP distribution cares: only whether it is alive. */
export interface XpRecipient {
  readonly alive: boolean;
}

/**
 * Split `totalXp` equally among the **living** members, flooring each share.
 * Dead members get `0`. The returned array is index-aligned with `members`.
 */
export function splitXpAmongLiving(
  totalXp: number,
  members: readonly XpRecipient[],
): number[] {
  const livingCount = members.filter((m) => m.alive).length;
  if (livingCount === 0) return members.map(() => 0);

  const share = Math.floor(totalXp / livingCount);
  return members.map((m) => (m.alive ? share : 0));
}

/**
 * Total XP required to *reach* `level` (level 1 needs 0). Placeholder triangular
 * curve: `100 × (level − 1) × level / 2`. Balancing is deferred (D-024).
 */
export function xpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error(`level must be an integer >= 1, got ${level}`);
  }
  return (100 * ((level - 1) * level)) / 2;
}

/** The level a character with `totalXp` accumulated XP has reached (>= 1). */
export function levelForTotalXp(totalXp: number): number {
  if (totalXp < 0) throw new Error(`totalXp must be >= 0, got ${totalXp}`);
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}
