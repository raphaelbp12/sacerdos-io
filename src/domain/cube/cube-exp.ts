import type { Item } from "../items/item";
import type { Rarity } from "../items/rarity";
import type { EquipmentSlot } from "../items/equipment-slot";
import { itemLevelOf } from "../items/item-level";

/**
 * Cube leveling (M17) — every item the cube consumes grants **Cube EXP**; accumulated EXP raises
 * the cube level, which unlocks operations and recipe tiers. Faithful to [cube.md](../../../docs/cube.md):
 *
 *   EXP = ⌊ grade × itemLvFactor × gearTypeFactor × itemTypeFactor × levelMatch × (1 + expBonus) ⌋
 *
 * Grade is the ×3 geometric ladder mapped onto our 5 tiers (cube.md's Common 2 … Immortal 162,
 * shifted so our Legendary = 162). The item-level factor interpolates cube.md's table; the
 * gear-type factor maps our equipment slots; item-type is gear (×1) for now (material ×12 deferred,
 * D-030); level-match decays with the gap between the item's level and the cube's.
 *
 * Cube-level EXP thresholds are cube.md's **sparse** anchors; `cubeLevelForExp` returns the highest
 * reached anchor (a fine-grained per-level curve is deferred, D-030).
 */

/** Cube-EXP base by grade — pure ×3 ladder over the 5 rarity tiers. */
const GRADE_EXP: Readonly<Record<Rarity, number>> = {
  Common: 2,
  Uncommon: 6,
  Rare: 18,
  Epic: 54,
  Legendary: 162,
};

/** Item-level factor anchors from cube.md, ascending by level. */
const ITEM_LEVEL_EXP_ANCHORS: readonly (readonly [number, number])[] = [
  [1, 1],
  [5, 10],
  [10, 40],
  [15, 120],
  [20, 240],
  [25, 408],
  [30, 612],
  [35, 816],
  [40, 1020],
  [45, 1224],
  [50, 1428],
  [55, 1632],
  [60, 1836],
  [65, 2040],
  [70, 2244],
  [75, 2448],
  [80, 2652],
  [85, 2856],
  [90, 3060],
];

/** Piecewise-linear item-level factor; clamped below the first anchor, flat past the last. */
function itemLevelExpFactor(level: number): number {
  const first = ITEM_LEVEL_EXP_ANCHORS[0];
  if (level <= first[0]) return first[1];
  const last = ITEM_LEVEL_EXP_ANCHORS[ITEM_LEVEL_EXP_ANCHORS.length - 1];
  if (level >= last[0]) return last[1];

  for (let i = 1; i < ITEM_LEVEL_EXP_ANCHORS.length; i++) {
    const [lo, loF] = ITEM_LEVEL_EXP_ANCHORS[i - 1];
    const [hi, hiF] = ITEM_LEVEL_EXP_ANCHORS[i];
    if (level <= hi) return loF + ((level - lo) * (hiF - loF)) / (hi - lo);
  }
  return last[1];
}

/** Gear-type EXP factor mapped from cube.md onto our equipment slots. */
const GEAR_TYPE_FACTOR: Readonly<Record<EquipmentSlot, number>> = {
  weapon: 1,
  body: 1,
  helm: 0.8,
  gloves: 0.75,
  boots: 0.7,
  ring: 3,
  amulet: 4,
};

function gearTypeFactor(item: Item): number {
  return item.slot ? GEAR_TYPE_FACTOR[item.slot] : 1;
}

/** Level-match falloff per level of gap, and its floor (an item is never worth exactly zero). */
const LEVEL_MATCH_FALLOFF = 0.05;
const MIN_LEVEL_MATCH = 0.01;

/** Closeness multiplier: 1.0 at the cube's level, decaying with the gap, floored above zero. */
function levelMatch(itemLevel: number, cubeLevel: number): number {
  const gap = Math.abs(itemLevel - cubeLevel);
  return Math.max(MIN_LEVEL_MATCH, 1 - gap * LEVEL_MATCH_FALLOFF);
}

export interface CubeExpOptions {
  /** Fractional Cube-EXP bonus from runes / pets, e.g. `0.5` for +50%. */
  readonly expBonus?: number;
}

/** Cube EXP a single consumed item grants at the given cube level. */
export function cubeExpForItem(
  item: Item,
  cubeLevel: number,
  opts: CubeExpOptions = {},
): number {
  const grade = GRADE_EXP[item.rarity];
  const level = itemLevelOf(item);
  const raw =
    grade *
    itemLevelExpFactor(level) *
    gearTypeFactor(item) *
    1 * // item-type: gear ×1 (material ×12 deferred, D-030)
    levelMatch(level, cubeLevel) *
    (1 + (opts.expBonus ?? 0));
  return Math.floor(raw);
}

/** Total Cube EXP required to reach a cube level (sparse anchors from cube.md). */
export const CUBE_EXP_THRESHOLDS: readonly {
  readonly level: number;
  readonly totalExp: number;
}[] = [
  { level: 1, totalExp: 0 },
  { level: 5, totalExp: 405 },
  { level: 8, totalExp: 2255 },
  { level: 10, totalExp: 4955 },
  { level: 15, totalExp: 26805 },
  { level: 20, totalExp: 106055 },
  { level: 25, totalExp: 306305 },
  { level: 50, totalExp: 8832555 },
  { level: 75, totalExp: 61983805 },
  { level: 100, totalExp: 234760055 },
];

/** The highest cube level whose EXP threshold `totalExp` has reached. */
export function cubeLevelForExp(totalExp: number): number {
  let level = CUBE_EXP_THRESHOLDS[0].level;
  for (const t of CUBE_EXP_THRESHOLDS) {
    if (totalExp >= t.totalExp) level = t.level;
    else break;
  }
  return level;
}

/** The cube's operations (cube.md). Behavior beyond synthesis/alchemy is deferred (D-018). */
export type CubeOperation =
  | "synthesis"
  | "alchemy"
  | "crafting"
  | "decoration"
  | "extraction"
  | "engraving"
  | "offering"
  | "inscription";

export interface CubeOperationDef {
  readonly op: CubeOperation;
  /** Cube level at which this operation unlocks. */
  readonly unlockLevel: number;
  /** One-time gold cost to unlock it. */
  readonly goldCost: number;
}

export const CUBE_OPERATIONS: readonly CubeOperationDef[] = [
  { op: "synthesis", unlockLevel: 1, goldCost: 0 },
  { op: "alchemy", unlockLevel: 1, goldCost: 10 },
  { op: "crafting", unlockLevel: 5, goldCost: 100 },
  { op: "decoration", unlockLevel: 8, goldCost: 300 },
  { op: "extraction", unlockLevel: 10, goldCost: 1000 },
  { op: "engraving", unlockLevel: 15, goldCost: 1000 },
  { op: "offering", unlockLevel: 20, goldCost: 3000 },
  { op: "inscription", unlockLevel: 25, goldCost: 10000 },
];

/** True when `op` is available at the given cube level. */
export function isOperationUnlocked(
  op: CubeOperation,
  cubeLevel: number,
): boolean {
  const def = CUBE_OPERATIONS.find((o) => o.op === op);
  return def !== undefined && cubeLevel >= def.unlockLevel;
}
