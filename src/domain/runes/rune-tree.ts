import type { RuneNode } from "./rune-node";

/**
 * The rune tree as DATA (M18). Shape mirrors the overview: one **root** → **2** mid branches →
 * **6** themed categories, each category fanning out into perk leaves. Depth drives cost and UI
 * discovery only — never a purchase gate (no prerequisites).
 *
 * Branches (overview's six themes):
 *   1 global stats · 2 experience · 3 drops/chests · 4 gold · 5 inventory/stash · 6 quality-of-life
 *
 * Numbers (`baseCost`, `maxLevel`, `perLevel`) are placeholders pending a gold-income curve
 * (balancing deferred, D-031). Adding/retuning a rune is a new/edited row here — never engine code.
 */
export const RUNE_TREE: readonly RuneNode[] = [
  // ── Root (depth 0) ──────────────────────────────────────────────────────────
  {
    id: "awakening",
    label: "Awakening",
    branch: 0,
    depth: 0,
    maxLevel: 10,
    baseCost: 100,
    effect: { kind: "stat", stat: "hp", modifierKind: "flat", perLevel: 10 },
  },

  // ── Mid branches (depth 1): left = power/progression, right = fortune/utility ─
  {
    id: "might",
    label: "Might",
    branch: 1,
    depth: 1,
    maxLevel: 10,
    baseCost: 100,
    effect: { kind: "stat", stat: "attack", modifierKind: "flat", perLevel: 5 },
  },
  {
    id: "fortune",
    label: "Fortune",
    branch: 4,
    depth: 1,
    maxLevel: 10,
    baseCost: 100,
    effect: { kind: "perk", perk: "goldPercent", perLevel: 0.05 },
  },

  // ── Branch 1 — global stats (depth 2 category + depth 3 leaves) ──────────────
  {
    id: "vitality",
    label: "Vitality",
    branch: 1,
    depth: 2,
    maxLevel: 20,
    baseCost: 120,
    effect: {
      kind: "stat",
      stat: "hp",
      modifierKind: "percentage",
      perLevel: 0.02,
    },
  },
  {
    id: "ferocity",
    label: "Ferocity",
    branch: 1,
    depth: 3,
    maxLevel: 20,
    baseCost: 120,
    effect: {
      kind: "stat",
      stat: "attack",
      modifierKind: "percentage",
      perLevel: 0.02,
    },
  },
  {
    id: "swiftness",
    label: "Swiftness",
    branch: 1,
    depth: 3,
    maxLevel: 10,
    baseCost: 150,
    effect: {
      kind: "stat",
      stat: "attackSpeed",
      modifierKind: "percentage",
      perLevel: 0.02,
    },
  },
  {
    id: "focus",
    label: "Focus",
    branch: 1,
    depth: 3,
    maxLevel: 10,
    baseCost: 150,
    effect: {
      kind: "stat",
      stat: "cooldownReduction",
      modifierKind: "flat",
      perLevel: 0.02,
    },
  },

  // ── Branch 2 — experience ────────────────────────────────────────────────────
  {
    id: "insight",
    label: "Insight",
    branch: 2,
    depth: 2,
    maxLevel: 20,
    baseCost: 120,
    effect: { kind: "perk", perk: "expPercent", perLevel: 0.05 },
  },
  {
    id: "tutelage",
    label: "Tutelage",
    branch: 2,
    depth: 3,
    maxLevel: 20,
    baseCost: 100,
    effect: { kind: "perk", perk: "expFlatMonster", perLevel: 1 },
  },
  {
    id: "conquest",
    label: "Conquest",
    branch: 2,
    depth: 3,
    maxLevel: 20,
    baseCost: 100,
    effect: { kind: "perk", perk: "expFlatBoss", perLevel: 10 },
  },

  // ── Branch 3 — drops & chests ────────────────────────────────────────────────
  {
    id: "greed",
    label: "Greed",
    branch: 3,
    depth: 2,
    maxLevel: 20,
    baseCost: 150,
    effect: { kind: "perk", perk: "dropChance", perLevel: 0.05 },
  },
  {
    id: "hoard",
    label: "Hoard",
    branch: 3,
    depth: 3,
    maxLevel: 20,
    baseCost: 150,
    effect: { kind: "perk", perk: "chestCapacity", perLevel: 5 },
  },

  // ── Branch 4 — gold ──────────────────────────────────────────────────────────
  {
    id: "avarice",
    label: "Avarice",
    branch: 4,
    depth: 3,
    maxLevel: 20,
    baseCost: 100,
    effect: { kind: "perk", perk: "goldFlatMonster", perLevel: 1 },
  },
  {
    id: "plunder",
    label: "Plunder",
    branch: 4,
    depth: 3,
    maxLevel: 20,
    baseCost: 100,
    effect: { kind: "perk", perk: "goldFlatBoss", perLevel: 10 },
  },

  // ── Branch 5 — inventory & stash ─────────────────────────────────────────────
  {
    id: "satchel",
    label: "Satchel",
    branch: 5,
    depth: 2,
    maxLevel: 20,
    baseCost: 200,
    effect: { kind: "perk", perk: "inventorySlots", perLevel: 5 },
  },
  {
    id: "vault",
    label: "Vault",
    branch: 5,
    depth: 3,
    maxLevel: 10,
    baseCost: 300,
    effect: { kind: "perk", perk: "stashTabs", perLevel: 1 },
  },

  // ── Branch 6 — quality of life ───────────────────────────────────────────────
  {
    id: "discipline",
    label: "Discipline",
    branch: 6,
    depth: 2,
    maxLevel: 5,
    baseCost: 500,
    effect: { kind: "perk", perk: "skillSlots", perLevel: 1 },
  },
  {
    id: "fellowship",
    label: "Fellowship",
    branch: 6,
    depth: 3,
    maxLevel: 5,
    baseCost: 500,
    effect: { kind: "perk", perk: "heroSlots", perLevel: 1 },
  },
  {
    id: "warband",
    label: "Warband",
    branch: 6,
    depth: 3,
    maxLevel: 5,
    baseCost: 800,
    effect: { kind: "perk", perk: "groupSlots", perLevel: 1 },
  },
  {
    id: "resilience",
    label: "Resilience",
    branch: 6,
    depth: 3,
    maxLevel: 20,
    baseCost: 150,
    effect: { kind: "perk", perk: "respawnFlatMs", perLevel: 5000 },
  },
  {
    id: "rebirth",
    label: "Rebirth",
    branch: 6,
    depth: 3,
    maxLevel: 10,
    baseCost: 250,
    effect: { kind: "perk", perk: "respawnPercent", perLevel: 0.03 },
  },
  {
    id: "transmutation",
    label: "Transmutation",
    branch: 6,
    depth: 3,
    maxLevel: 20,
    baseCost: 200,
    effect: { kind: "perk", perk: "cubeExpPercent", perLevel: 0.05 },
  },
];
