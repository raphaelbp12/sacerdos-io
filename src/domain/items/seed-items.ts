/**
 * Hand-authored starter item catalog for Milestone 2.5 / 3.
 * Pure data — no behavior. New items are added here, not as new classes.
 */
import type { Item } from "./item";

export const SEED_ITEMS: readonly Item[] = [
  // ── Equippables ────────────────────────────────────────────────────────────
  {
    id: "boots-of-agility",
    name: "Boots of Agility",
    rarity: "Common",
    kind: "equippable",
    levelReq: 1,
    slot: "boots",
    modifiers: [{ attribute: "AGI", kind: "flat", value: 5 }],
  },
  {
    id: "iron-helm",
    name: "Iron Helm",
    rarity: "Common",
    kind: "equippable",
    levelReq: 1,
    slot: "helm",
    modifiers: [{ attribute: "HP", kind: "flat", value: 20 }],
  },
  {
    id: "mage-staff",
    name: "Mage Staff",
    rarity: "Uncommon",
    kind: "equippable",
    levelReq: 3,
    slot: "weapon",
    modifiers: [
      { attribute: "INT", kind: "flat", value: 8 },
      { attribute: "MP", kind: "percentage", value: 0.25 },
    ],
  },
  {
    id: "berserker-ring",
    name: "Berserker Ring",
    rarity: "Rare",
    kind: "equippable",
    levelReq: 2,
    slot: "ring",
    modifiers: [{ attribute: "STR", kind: "flat", value: 12 }],
  },

  // ── Consumables ────────────────────────────────────────────────────────────
  {
    id: "healing-potion",
    name: "Healing Potion",
    rarity: "Common",
    kind: "consumable",
    levelReq: 1,
    modifiers: [],
    instantEffects: [{ type: "heal", attribute: "HP", amount: 30 }],
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
      modifiers: [{ attribute: "AGI", kind: "flat", value: 5 }],
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
      modifiers: [{ attribute: "STR", kind: "flat", value: 8 }],
    },
  },
];
