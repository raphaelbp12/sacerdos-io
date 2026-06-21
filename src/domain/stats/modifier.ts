import type { Stat } from "./stat";

export type ModifierKind = "flat" | "percentage";

/**
 * A modifier is plain data — not a class. It describes a change to one stat.
 *
 * Percentage convention: store as a fraction where 0.10 means +10%.
 * The formula multiplies base by (1 + value). Never pass 10 for "10%".
 */
export interface Modifier {
  readonly attribute: Stat;
  readonly kind: ModifierKind;
  readonly value: number;
}

/**
 * Anything that contributes modifiers (equipped items, active buffs, …).
 * compute-stat never needs to know where modifiers come from.
 */
export interface ModifierSource {
  getModifiers(): readonly Modifier[];
}
