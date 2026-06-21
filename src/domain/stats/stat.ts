import type { ModifierKind } from "./modifier";

/**
 * The canonical combat stat set (M6).
 *
 * Replaces the early bootstrap attributes (HP/MP/STR/AGI/INT). Every value the
 * game reads is one of these. New content is data referencing these ids — never
 * a new stat type without a schema entry below.
 */
export type Stat =
  | "hp"
  | "attack"
  | "physicalDamage"
  | "damage"
  | "armor"
  | "attackSpeed"
  | "cooldownReduction"
  | "areaOfEffect"
  | "blockChance"
  | "dodgeChance"
  | "damageReduction"
  | "damageAbsorption"
  | "fireResist"
  | "coldResist"
  | "lightningResist"
  | "chaosResist"
  | "fireDamage"
  | "coldDamage"
  | "lightningDamage"
  | "chaosDamage";

/**
 * Per-stat rules, expressed as DATA so the modifier engine stays generic.
 *
 * - `kinds`   : which modifier kinds the stat accepts.
 *               • Multiplicative stats accept `flat` and `percentage` — a `percentage`
 *                 modifier multiplies the base via computeStat's `× Π(1+v)`.
 *               • Fraction / chance stats accept only `flat`: their values are fractions
 *                 (0.10 = +10%) that must SUM, which `flat` does (`base + Σflat`). Using
 *                 `percentage` on a base-0 stat would multiply to 0 — wrong — so it is rejected.
 * - `default` : the base value used when a holder does not specify one (e.g. attackSpeed 1.0).
 * - `min`/`max`: optional clamp applied AFTER computeStat (e.g. chances/resists clamp to [0,1]).
 */
export interface StatSchema {
  readonly kinds: readonly ModifierKind[];
  readonly default: number;
  readonly min?: number;
  readonly max?: number;
}

const BOTH: readonly ModifierKind[] = ["flat", "percentage"];
const FLAT_ONLY: readonly ModifierKind[] = ["flat"];

export const STAT_SCHEMA: Readonly<Record<Stat, StatSchema>> = {
  // ── Multiplicative stats (meaningful base; % multiplies) ──────────────────
  hp: { kinds: BOTH, default: 0 },
  attack: { kinds: BOTH, default: 0 },
  physicalDamage: { kinds: BOTH, default: 0 },
  armor: { kinds: BOTH, default: 0 },
  attackSpeed: { kinds: BOTH, default: 1.0 },
  areaOfEffect: { kinds: BOTH, default: 0 },
  fireDamage: { kinds: BOTH, default: 0 },
  coldDamage: { kinds: BOTH, default: 0 },
  lightningDamage: { kinds: BOTH, default: 0 },
  chaosDamage: { kinds: BOTH, default: 0 },

  // ── Additive fractions (sum via flat); some clamped to [0,1] ──────────────
  damage: { kinds: FLAT_ONLY, default: 0 },
  cooldownReduction: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  blockChance: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  dodgeChance: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  damageReduction: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  fireResist: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  coldResist: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  lightningResist: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },
  chaosResist: { kinds: FLAT_ONLY, default: 0, min: 0, max: 1 },

  // ── Flat last-layer subtract (no clamp) ───────────────────────────────────
  damageAbsorption: { kinds: FLAT_ONLY, default: 0 },
};

/** All canonical stats, derived from the schema (single source of truth). */
export const STATS: readonly Stat[] = Object.keys(STAT_SCHEMA) as Stat[];

/** The base value a stat falls back to when a holder does not specify one. */
export function defaultStat(stat: Stat): number {
  return STAT_SCHEMA[stat].default;
}

/** Whether `stat` accepts modifiers of `kind`. */
export function statAcceptsKind(stat: Stat, kind: ModifierKind): boolean {
  return STAT_SCHEMA[stat].kinds.includes(kind);
}

/** Clamps a computed value into the stat's `[min, max]` range (if any). */
export function clampStat(stat: Stat, value: number): number {
  const { min, max } = STAT_SCHEMA[stat];
  let v = value;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}
