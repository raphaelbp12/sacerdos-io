import type { Rng } from "../rng/rng";
import type { Modifier, ModifierKind } from "../stats/modifier";
import type { Stat } from "../stats/stat";
import type { Rarity } from "./rarity";
import type { EquipCategory, SocketType } from "./socket";

/** A min–max roll band for one stat a material grants on one equipment category. */
export interface MaterialStatRange {
  readonly attribute: Stat;
  readonly kind: ModifierKind;
  /** Inclusive lower bound of the roll. For percentages this is a fraction (0.20 = +20%). */
  readonly min: number;
  /** Inclusive upper bound of the roll. */
  readonly max: number;
}

/**
 * A material ("gem") is DATA — applying it into a matching socket adds its rolled modifier.
 * The granted stat differs by the equipment category it is socketed into.
 */
export interface MaterialDef {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  /** Which socket type this material fits (1 decoration / 2 engraving / 3 inscription). */
  readonly socketType: SocketType;
  /** The stat range granted, per equipment category. */
  readonly byCategory: Readonly<Record<EquipCategory, MaterialStatRange>>;
}

/**
 * A representative subset of `docs/material-effects.md` (the full table is content/balancing
 * work — D-029). These rows exercise type-1 & type-2 sockets and flat & percentage rolls across
 * all three categories. Percentages are stored as fractions to match the modifier convention.
 */
export const MATERIALS: readonly MaterialDef[] = [
  {
    id: "minor-ruby",
    name: "Minor Ruby",
    rarity: "Common",
    socketType: 1,
    byCategory: {
      weapon: {
        attribute: "fireDamage",
        kind: "percentage",
        min: 0.2,
        max: 0.3,
      },
      armor: { attribute: "fireResist", kind: "flat", min: 0.05, max: 0.1 },
      accessory: { attribute: "attack", kind: "flat", min: 1, max: 2 },
    },
  },
  {
    id: "minor-amethyst",
    name: "Minor Amethyst",
    rarity: "Common",
    socketType: 1,
    byCategory: {
      weapon: {
        attribute: "physicalDamage",
        kind: "percentage",
        min: 0.2,
        max: 0.3,
      },
      armor: { attribute: "hp", kind: "flat", min: 10, max: 30 },
      accessory: {
        attribute: "cooldownReduction",
        kind: "flat",
        min: 0.01,
        max: 0.025,
      },
    },
  },
  {
    id: "minor-emerald",
    name: "Minor Emerald",
    rarity: "Common",
    socketType: 1,
    byCategory: {
      weapon: {
        attribute: "attackSpeed",
        kind: "percentage",
        min: 0.05,
        max: 0.06,
      },
      armor: { attribute: "damageAbsorption", kind: "flat", min: 10, max: 10 },
      accessory: {
        attribute: "areaOfEffect",
        kind: "percentage",
        min: 0.08,
        max: 0.09,
      },
    },
  },
  {
    // Engraving (type 2). Models a single stat per category for now — the doc's 50/50
    // dual-stat coin-flip is deferred (D-028).
    id: "goblin-hide",
    name: "Goblin Hide",
    rarity: "Common",
    socketType: 2,
    byCategory: {
      weapon: {
        attribute: "fireDamage",
        kind: "percentage",
        min: 0.2,
        max: 0.3,
      },
      armor: { attribute: "fireResist", kind: "flat", min: 0.05, max: 0.1 },
      accessory: { attribute: "hp", kind: "flat", min: 10, max: 30 },
    },
  },
];

/** Looks up a material definition by id, or `undefined` if none matches. */
export function materialById(id: string): MaterialDef | undefined {
  return MATERIALS.find((m) => m.id === id);
}

/**
 * Rolls a material into a concrete Modifier for the given equipment category.
 * The value is drawn continuously in `[min, max]` via the injected `rng` (never Math.random).
 */
export function rollMaterial(
  rng: Rng,
  material: MaterialDef,
  category: EquipCategory,
): Modifier {
  const range = material.byCategory[category];
  const value = range.min + rng.nextFloat() * (range.max - range.min);
  return { attribute: range.attribute, kind: range.kind, value };
}
