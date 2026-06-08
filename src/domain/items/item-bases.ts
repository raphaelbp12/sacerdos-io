import type { ItemBase } from "./item-base";

/**
 * The archetype database.
 *
 * Rules for contributors:
 * - One row per gear archetype (not per level — level scaling is handled by the curve).
 * - `id` must be unique across the entire array.
 * - `minLevel` must be >= 1.
 * - `rollableAttributes` must be non-empty and contain valid Attribute values.
 * - `slot` must be a valid EquipmentSlot.
 *
 * To add a new gear type: add a row here. No engine code changes needed.
 */
export const ITEM_BASES: readonly ItemBase[] = [
  // ── Tier 1 — unlocked from level 1 ────────────────────────────────────────
  {
    id: "short-sword",
    name: "Short Sword",
    kind: "equippable",
    slot: "weapon",
    minLevel: 1,
    rollableAttributes: ["STR"],
  },
  {
    id: "leather-helm",
    name: "Leather Helm",
    kind: "equippable",
    slot: "helm",
    minLevel: 1,
    rollableAttributes: ["HP"],
  },
  {
    id: "leather-body",
    name: "Leather Body",
    kind: "equippable",
    slot: "body",
    minLevel: 1,
    rollableAttributes: ["HP"],
  },
  {
    id: "leather-gloves",
    name: "Leather Gloves",
    kind: "equippable",
    slot: "gloves",
    minLevel: 1,
    rollableAttributes: ["AGI"],
  },
  {
    id: "leather-boots",
    name: "Leather Boots",
    kind: "equippable",
    slot: "boots",
    minLevel: 1,
    rollableAttributes: ["AGI"],
  },
  {
    id: "copper-ring",
    name: "Copper Ring",
    kind: "equippable",
    slot: "ring",
    minLevel: 1,
    rollableAttributes: ["INT", "STR"],
  },
  {
    id: "copper-amulet",
    name: "Copper Amulet",
    kind: "equippable",
    slot: "amulet",
    minLevel: 1,
    rollableAttributes: ["MP"],
  },

  // ── Tier 2 — unlocked from level 10 ───────────────────────────────────────
  {
    id: "plate-body",
    name: "Plate Body",
    kind: "equippable",
    slot: "body",
    minLevel: 10,
    rollableAttributes: ["HP", "STR"],
  },
];
