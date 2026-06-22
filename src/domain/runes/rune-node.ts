import type { Stat, ModifierKind } from "../stats";

/**
 * Account-wide, non-stat rune perks (M18).
 *
 * Stat buffs flow through the modifier engine (see `RuneEffect`'s `stat` variant); everything
 * here is a value some *other* system reads — gold, exp, drops, capacities, respawn, cube EXP and
 * the quality-of-life slot counts from the overview's six rune branches. Each is a fraction
 * (`*Percent`) or a flat amount, summed across nodes by `RuneState.perkValue`.
 */
export type RunePerk =
  | "expPercent"
  | "expFlatMonster"
  | "expFlatBoss"
  | "goldPercent"
  | "goldFlatMonster"
  | "goldFlatBoss"
  | "dropChance"
  | "chestCapacity"
  | "inventorySlots"
  | "stashTabs"
  | "respawnFlatMs"
  | "respawnPercent"
  | "cubeExpPercent"
  | "skillSlots"
  | "heroSlots"
  | "groupSlots";

/**
 * What a node *does* per level — DATA, one effect per node (data-not-code).
 *
 * - `stat`: contributes a `Modifier` (picked up by `getStat` like a passive/item).
 * - `perk`: contributes to a typed account perk read by another system.
 */
export type RuneEffect =
  | {
      readonly kind: "stat";
      readonly stat: Stat;
      readonly modifierKind: ModifierKind;
      readonly perLevel: number;
    }
  | {
      readonly kind: "perk";
      readonly perk: RunePerk;
      readonly perLevel: number;
    };

/**
 * A rune node as a data row. `depth` and `branch` describe the tree purely for **cost** and
 * **UI discovery** — they never gate a purchase (overview: "there are no pre-requisites, they
 * only cost gold").
 */
export interface RuneNode {
  readonly id: string;
  readonly label: string;
  /** Theme branch 1–6 (0 for the shared root). UI grouping only. */
  readonly branch: number;
  /** Distance from the root (0 = root). Scales cost; deeper = pricier. */
  readonly depth: number;
  /** Maximum levels that can be bought into this node. */
  readonly maxLevel: number;
  /** Gold cost of the *first* level, before depth/level scaling. */
  readonly baseCost: number;
  readonly effect: RuneEffect;
}

/** Per-depth cost growth — a node one step deeper costs ×1.5 (balancing deferred, D-031). */
export const RUNE_DEPTH_GROWTH = 1.5;

/**
 * Gold cost to raise `node` from `currentLevel` to `currentLevel + 1`.
 *
 * `⌊ baseCost × DEPTH_GROWTH^depth × (currentLevel + 1) ⌋` — strictly increasing in both depth
 * and level, the only shape the overview pins down. Throws when `currentLevel` is out of `[0,
 * maxLevel)` (a maxed node has nothing left to buy).
 */
export function runeCostAt(node: RuneNode, currentLevel: number): number {
  if (!Number.isInteger(currentLevel) || currentLevel < 0) {
    throw new Error(
      `runeCostAt: currentLevel must be an integer >= 0, got ${currentLevel}`,
    );
  }
  if (currentLevel >= node.maxLevel) {
    throw new Error(
      `runeCostAt: node "${node.id}" is already at max level ${node.maxLevel}`,
    );
  }
  const nextLevel = currentLevel + 1;
  return Math.floor(
    node.baseCost * Math.pow(RUNE_DEPTH_GROWTH, node.depth) * nextLevel,
  );
}
