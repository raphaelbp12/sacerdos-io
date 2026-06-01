import type { Modifier } from "../stats/modifier";
import type { Rarity } from "./rarity";
import type { EquipmentSlot } from "./equipment-slot";

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
  readonly modifiers: readonly Modifier[];
}
