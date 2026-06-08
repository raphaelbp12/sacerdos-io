import type { Modifier, ModifierSource } from "../stats/modifier";
import type { EquipmentSlot } from "./equipment-slot";
import type { Item } from "./item";

export class Equipment implements ModifierSource {
  private readonly slots = new Map<EquipmentSlot, Item>();

  /**
   * Equips an item into its designated slot.
   * - Throws if the item is not equippable.
   * - Throws if characterLevel is below the item's levelReq (hard block).
   * - Returns the previously equipped item in that slot, or undefined if the slot was empty.
   */
  equip(item: Item, characterLevel: number): Item | undefined {
    if (item.kind !== "equippable" || item.slot == null) {
      throw new Error(`Item "${item.name}" is not equippable.`);
    }
    if (characterLevel < item.levelReq) {
      throw new Error(
        `Level ${characterLevel} is below the required level ${item.levelReq} for "${item.name}".`,
      );
    }
    const displaced = this.slots.get(item.slot);
    this.slots.set(item.slot, item);
    return displaced;
  }

  /** Removes the item from the given slot and returns it, or undefined if the slot was empty. */
  unequip(slot: EquipmentSlot): Item | undefined {
    const item = this.slots.get(slot);
    this.slots.delete(slot);
    return item;
  }

  getEquipped(slot: EquipmentSlot): Item | undefined {
    return this.slots.get(slot);
  }

  /** Implements ModifierSource — aggregates modifiers from all currently equipped items. */
  getModifiers(): readonly Modifier[] {
    const result: Modifier[] = [];
    for (const item of this.slots.values()) {
      result.push(...item.modifiers);
    }
    return result;
  }
}
