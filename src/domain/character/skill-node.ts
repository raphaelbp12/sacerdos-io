import type { ChoiceNode } from "./choice-node";

/**
 * The Knight's four skills as spendable build nodes (1 per band, list order).
 *
 * M7 only registers their band + max rank so the skill-point allocator can gate
 * and cap them exactly like passives. Their *resolution* (cooldowns, damage,
 * buffs/debuffs) is Milestone 8 — see docs/game-implementation-roadmap.md §M8.
 */
export const KNIGHT_SKILL_NODES: readonly ChoiceNode[] = [
  { id: "smash", band: 1, maxRank: 5 },
  { id: "shatter", band: 2, maxRank: 5 },
  { id: "raise-shield", band: 3, maxRank: 5 },
  { id: "provoke", band: 4, maxRank: 5 },
];
