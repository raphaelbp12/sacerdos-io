import type { Stat } from "../stats/stat";

/**
 * A one-shot effect applied instantly when an item is used.
 * Extend the `type` union as new instant effects are added.
 */
export interface InstantEffectDef {
  readonly type: "heal";
  /** The stat targeted by the effect (e.g. 'hp' for a healing potion). */
  readonly attribute: Stat;
  readonly amount: number;
}
