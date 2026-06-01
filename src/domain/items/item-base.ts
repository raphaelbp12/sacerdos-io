import type { ItemKind } from "./item";
import type { EquipmentSlot } from "./equipment-slot";
import type { Attribute } from "../stats/attribute";

/**
 * An ItemBase is a level-agnostic archetype — "a sword", "leather helm", etc.
 * It defines what a gear type _is_ and what it _may roll_, without specifying
 * exact modifier values (those are computed at generation time from item level).
 *
 * A designer adds a new gear type by adding one row to ITEM_BASES.
 * No engine code changes are required.
 */
export interface ItemBase {
  /** Unique machine-readable identifier, e.g. "short-sword". */
  readonly id: string;
  /** Human-readable display name, e.g. "Short Sword". */
  readonly name: string;
  /** Always "equippable" for gear archetypes. */
  readonly kind: ItemKind;
  /** The equipment slot this base occupies. */
  readonly slot: EquipmentSlot;
  /** Earliest item level at which this base may be rolled. Minimum value: 1. */
  readonly minLevel: number;
  /** The attributes this base can roll modifiers for. Must be non-empty. */
  readonly rollableAttributes: readonly Attribute[];
}
