import type { Rng } from "../rng/rng";
import type { Item } from "../items/item";
import type { Rarity } from "../items/rarity";
import { RARITIES } from "../items/rarity";
import { generateItem } from "../items/generate-item";
import { itemLevelOf } from "../items/item-level";
import { withinThreshold, type Threshold } from "./threshold";

/** Default recycle ratio — N same-rarity items collapse into 1 of the next rarity. */
export const SYNTHESIS_RATIO = 3;

/** Why a synthesis attempt was rejected. */
export type SynthesisError =
  | "wrong-count"
  | "mixed-rarity"
  | "mixed-kind"
  | "unsupported-kind"
  | "max-rarity"
  | "out-of-threshold";

export type SynthesisResult =
  | { readonly ok: true; readonly item: Item }
  | { readonly ok: false; readonly reason: SynthesisError };

export interface SynthesisOptions {
  /** The active item-level band; every input must fall inside it. */
  readonly threshold: Threshold;
  /** Items consumed per output (defaults to {@link SYNTHESIS_RATIO}). */
  readonly ratio?: number;
}

/** The rarity one tier above `r`, or `undefined` if `r` is already the top tier. */
function nextRarity(r: Rarity): Rarity | undefined {
  return RARITIES[RARITIES.indexOf(r) + 1];
}

/**
 * Synthesis (M17) — recycle `ratio` items of the same rarity into **one fresh roll** of the next
 * rarity. The output's stats are rolled anew via {@link generateItem}; nothing is inherited from
 * the inputs (overview: "the output item is a fresh roll").
 *
 * Rules enforced (each is a rejection reason, in check order):
 *  1. exactly `ratio` inputs (`wrong-count`).
 *  2. all inputs share one rarity (`mixed-rarity`).
 *  3. all inputs share one kind (`mixed-kind`); only `equippable` is supported for a fresh roll —
 *     misc / consumable synthesis is deferred (`unsupported-kind`).
 *  4. that rarity has a higher tier (`max-rarity`).
 *  5. every input's item level sits inside the selected threshold band (`out-of-threshold`).
 *
 * Pure: all randomness flows through the injected `rng`; the inputs are never mutated.
 */
export function synthesize(
  rng: Rng,
  items: readonly Item[],
  opts: SynthesisOptions,
): SynthesisResult {
  const ratio = opts.ratio ?? SYNTHESIS_RATIO;

  if (items.length !== ratio) return { ok: false, reason: "wrong-count" };

  const rarity = items[0].rarity;
  if (items.some((i) => i.rarity !== rarity))
    return { ok: false, reason: "mixed-rarity" };

  const kind = items[0].kind;
  if (items.some((i) => i.kind !== kind))
    return { ok: false, reason: "mixed-kind" };
  if (kind !== "equippable") return { ok: false, reason: "unsupported-kind" };

  const upgraded = nextRarity(rarity);
  if (upgraded === undefined) return { ok: false, reason: "max-rarity" };

  if (items.some((i) => !withinThreshold(itemLevelOf(i), opts.threshold)))
    return { ok: false, reason: "out-of-threshold" };

  const outputLevel = Math.max(...items.map(itemLevelOf));
  const item = generateItem(rng, { itemLevel: outputLevel, rarity: upgraded });
  return { ok: true, item };
}
