import type { Modifier, ModifierSource } from "../stats";
import type { ChoiceNode } from "./choice-node";
import { bandUnlockLevel, unlockedBand } from "./choice-node";
import { KNIGHT_PASSIVES, PassiveAllocation } from "./passive-def";
import { KNIGHT_SKILL_NODES } from "./skill-node";

/** Default node registry: every Knight passive + skill is spendable. */
const DEFAULT_NODES: readonly ChoiceNode[] = [
  ...KNIGHT_PASSIVES,
  ...KNIGHT_SKILL_NODES,
];

/**
 * The player's point allocation — "the build".
 *
 * Rules (overview "level point choices"):
 * - Earn 1 skill point per character level.
 * - Each rank in a passive or skill costs 1 point.
 * - A node can only be raised once its band is unlocked by the character's level
 *   (band 1 → lvl 1, band 2 → lvl 11, …).
 * - A node is capped at its `maxRank`.
 * - Points can be refunded at any time and re-spent (refund is free in v1).
 *
 * Compute-don't-store: available points are derived from earned − spent, never
 * cached. A `Build` is itself a live `ModifierSource` (its passive ranks project
 * to modifiers on every read), so a `Character` holding it reflects refunds /
 * re-spends on the next `getStat()` with no invalidation.
 */
export class Build implements ModifierSource {
  readonly level: number;
  private readonly nodes: ReadonlyMap<string, ChoiceNode>;
  private readonly ranks: Map<string, number> = new Map();

  constructor(level: number, registry: readonly ChoiceNode[] = DEFAULT_NODES) {
    if (!Number.isInteger(level) || level < 1) {
      throw new Error(`Level must be an integer >= 1 (got ${level}).`);
    }
    this.level = level;
    this.nodes = new Map(registry.map((n) => [n.id, n]));
  }

  /** Total points earned so far (1 per level). */
  get earnedPoints(): number {
    return this.level;
  }

  /** Points currently committed across all nodes. */
  get spentPoints(): number {
    let total = 0;
    for (const rank of this.ranks.values()) total += rank;
    return total;
  }

  /** Points free to spend right now. */
  get availablePoints(): number {
    return this.earnedPoints - this.spentPoints;
  }

  /** Ranks currently put into `id` (0 if none). */
  rankOf(id: string): number {
    return this.ranks.get(id) ?? 0;
  }

  /** Spends one point into `id`. Throws if the move is illegal. */
  spend(id: string): void {
    const node = this.requireNode(id);
    if (node.band > unlockedBand(this.level)) {
      throw new Error(
        `"${id}" is locked: band ${node.band} unlocks at level ${bandUnlockLevel(node.band)}.`,
      );
    }
    const rank = this.rankOf(id);
    if (rank >= node.maxRank) {
      throw new Error(`"${id}" is already at max rank (${node.maxRank}).`);
    }
    if (this.availablePoints < 1) {
      throw new Error(`No skill points available to spend.`);
    }
    this.ranks.set(id, rank + 1);
  }

  /** Refunds one point from `id` back to the pool. Throws if it has no ranks. */
  refund(id: string): void {
    this.requireNode(id);
    const rank = this.rankOf(id);
    if (rank <= 0) {
      throw new Error(`"${id}" has no ranks to refund.`);
    }
    this.ranks.set(id, rank - 1);
  }

  /** A live `ModifierSource` reflecting the current passive ranks. */
  toPassiveAllocation(): PassiveAllocation {
    return new PassiveAllocation(Object.fromEntries(this.ranks));
  }

  /** Live passive modifiers from the current ranks (`ModifierSource`). */
  getModifiers(): readonly Modifier[] {
    return this.toPassiveAllocation().getModifiers();
  }

  private requireNode(id: string): ChoiceNode {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Unknown build node "${id}".`);
    }
    return node;
  }
}
