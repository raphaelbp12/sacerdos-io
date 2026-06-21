/**
 * Hand-authored starter item catalog for Milestone 2.5 / 3 / 4.
 *
 * Modifier values are authored at their Common (1×) base.
 * scaleItem() multiplies them by the item's rarity tier at build time,
 * so SEED_ITEMS always contains correctly-scaled values.
 *
 * Milestone 5 decision: the equippable entries here are kept as a
 * "starter gift" — the player spawns with them in inventory so they can
 * immediately equip something and see stats update, without having to click
 * "Generate Item" first. Consumables stay for the same reason.
 * Future work: replace the starter equippables with generated items seeded
 * from a fixed seed so the opening inventory is still deterministic.
 */
import type { Item } from "./item";
import { scaleItem } from "./scale-item";

const RAW_ITEMS: readonly Item[] = [
  // ── Equippables ────────────────────────────────────────────────────────────
  // Modifiers are BASE values (Common 1×); scaleItem applies the multiplier.
  {
    id: "boots-of-agility",
    name: "Boots of Agility",
    rarity: "Common",
    kind: "equippable",
    levelReq: 1,
    slot: "boots",
    modifiers: [{ attribute: "armor", kind: "flat", value: 5 }],
  },
  {
    id: "iron-helm",
    name: "Iron Helm",
    rarity: "Legendary",
    kind: "equippable",
    levelReq: 1,
    slot: "helm",
    modifiers: [{ attribute: "hp", kind: "flat", value: 20 }],
  },
  {
    id: "mage-staff",
    name: "Mage Staff",
    rarity: "Uncommon", // 2× → attack 16, hp +20%
    kind: "equippable",
    levelReq: 3,
    slot: "weapon",
    modifiers: [
      { attribute: "attack", kind: "flat", value: 8 },
      { attribute: "hp", kind: "percentage", value: 0.1 },
    ],
  },
  {
    id: "berserker-ring",
    name: "Berserker Ring",
    rarity: "Rare", // 3× → attack +12
    kind: "equippable",
    levelReq: 2,
    slot: "ring",
    modifiers: [{ attribute: "attack", kind: "flat", value: 4 }],
  },

  // ── Consumables ────────────────────────────────────────────────────────────
  // Consumable modifiers (inside buff) are also scaled; instant amounts are not
  // (they represent a fixed heal value, not a stat multiplier).
  {
    id: "healing-potion",
    name: "Healing Potion",
    rarity: "Common",
    kind: "consumable",
    levelReq: 1,
    modifiers: [],
    instantEffects: [{ type: "heal", attribute: "hp", amount: 30 }],
  },
  {
    id: "agility-elixir",
    name: "Agility Elixir",
    rarity: "Uncommon",
    kind: "consumable",
    levelReq: 1,
    modifiers: [],
    buff: {
      id: "agi-elixir-buff",
      name: "Agility Boost",
      duration: 3,
      modifiers: [{ attribute: "attack", kind: "flat", value: 5 }],
    },
  },
  {
    id: "strength-draught",
    name: "Strength Draught",
    rarity: "Uncommon",
    kind: "consumable",
    levelReq: 1,
    modifiers: [],
    buff: {
      id: "str-draught-buff",
      name: "Strength Boost",
      duration: 5,
      modifiers: [{ attribute: "armor", kind: "flat", value: 8 }],
    },
  },
];

export const SEED_ITEMS: readonly Item[] = RAW_ITEMS.map(scaleItem);
