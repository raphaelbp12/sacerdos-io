import type { Modifier } from "../stats/modifier";
import type { Rarity } from "./rarity";
import type { EquipmentSlot } from "./equipment-slot";
import type { Socket } from "./socket";
import type { InstantEffectDef } from "../effects/instant-effect";
import type { BuffDef } from "../effects/buff";

export type ItemKind = "consumable" | "equippable" | "misc";

export interface Item {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly kind: ItemKind;
  /** Minimum character level required to equip this item. */
  readonly levelReq: number;
  /** Required when kind === 'equippable'. */
  readonly slot?: EquipmentSlot;
  /** Passive modifiers active while the item is equipped. */
  readonly modifiers: readonly Modifier[];
  /**
   * Item-modifier sockets (M16). Count & types derive from rarity; a socket is
   * filled by applying a material. Absent/empty sockets contribute no modifiers.
   * The item's *effective* modifiers are `modifiers` ++ socketed material modifiers.
   */
  readonly sockets?: readonly Socket[];
  /** One-shot effects applied when a consumable is used. */
  readonly instantEffects?: readonly InstantEffectDef[];
  /** Timed buff applied when a consumable is used. */
  readonly buff?: BuffDef;
}
