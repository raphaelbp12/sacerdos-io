import type { Attribute } from "../stats/attribute";

/**
 * A one-shot effect applied instantly when an item is used.
 * Extend the `type` union as new instant effects are added.
 */
export interface InstantEffectDef {
  readonly type: "heal";
  /** The attribute targeted by the effect (e.g. 'HP' for a healing potion). */
  readonly attribute: Attribute;
  readonly amount: number;
}
