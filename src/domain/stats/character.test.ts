import { describe, it, expect } from "vitest";
import { Character } from "./character";
import type { Modifier, ModifierSource } from "./modifier";
import type { Item } from "../items/item";

const BASE_STATS = { hp: 100, armor: 8, attack: 10 };

/** Wraps a raw modifier array in a ModifierSource for test convenience. */
function src(mods: Modifier[]): ModifierSource {
  return { getModifiers: () => mods };
}

describe("Character.getStat", () => {
  // Step 3.1 — milestone acceptance test
  it("returns base + flat modifier for the same stat (headline acceptance test)", () => {
    const c = new Character(BASE_STATS, [
      src([{ attribute: "attack", kind: "flat", value: 5 }]),
    ]);
    expect(c.getStat("attack")).toBe(15);
  });

  it("computes on every read without storing a result", () => {
    const c = new Character(BASE_STATS, [
      src([{ attribute: "attack", kind: "flat", value: 5 }]),
    ]);
    // Call twice — must return the same value both times (no mutation side-effect)
    expect(c.getStat("attack")).toBe(15);
    expect(c.getStat("attack")).toBe(15);
  });

  // Step 3.2 — stat isolation
  it("ignores modifiers targeting a different stat", () => {
    const c = new Character(BASE_STATS, [
      src([{ attribute: "armor", kind: "flat", value: 5 }]),
    ]);
    expect(c.getStat("attack")).toBe(10);
  });

  it("returns exact base value for a stat with no modifiers", () => {
    const c = new Character(BASE_STATS, []);
    expect(c.getStat("hp")).toBe(100);
  });

  it("falls back to the schema default for an unspecified stat", () => {
    const c = new Character(BASE_STATS, []);
    // attackSpeed not in BASE_STATS → schema default 1.0
    expect(c.getStat("attackSpeed")).toBe(1.0);
    // blockChance not specified → default 0
    expect(c.getStat("blockChance")).toBe(0);
  });

  it("clamps a chance stat into [0, 1] on read", () => {
    const c = new Character(BASE_STATS, [
      src([{ attribute: "blockChance", kind: "flat", value: 1.5 }]),
    ]);
    expect(c.getStat("blockChance")).toBe(1);
  });

  it("applies mixed modifiers only to the correct stat", () => {
    const c = new Character(BASE_STATS, [
      src([
        { attribute: "attack", kind: "flat", value: 5 },
        { attribute: "attack", kind: "percentage", value: 0.1 },
      ]),
    ]);
    // (10 + 5) * 1.1 = 16.5
    expect(c.getStat("attack")).toBeCloseTo(16.5);
    // armor is unaffected
    expect(c.getStat("armor")).toBe(8);
  });
});

// ── Milestone 3: currentHP ───────────────────────────────────────────────────

describe("Character.currentHP", () => {
  it("starts at maxHP (getStat hp)", () => {
    const c = new Character(BASE_STATS);
    expect(c.currentHP).toBe(100);
  });

  it("takeDamage reduces currentHP", () => {
    const c = new Character(BASE_STATS);
    c.takeDamage(10);
    expect(c.currentHP).toBe(90);
  });

  it("currentHP cannot go below zero", () => {
    const c = new Character(BASE_STATS);
    c.takeDamage(999);
    expect(c.currentHP).toBe(0);
  });
});

// ── Milestone 3: InstantEffect (heal) ───────────────────────────────────────

const HEALING_POTION: Item = {
  id: "healing-potion",
  name: "Healing Potion",
  rarity: "Common",
  kind: "consumable",
  levelReq: 1,
  modifiers: [],
  instantEffects: [{ type: "heal", attribute: "hp", amount: 10 }],
};

describe("Character.use — InstantEffect (Milestone 3 acceptance)", () => {
  it("heal potion restores HP: 90 → 100", () => {
    const c = new Character(BASE_STATS);
    c.takeDamage(10); // HP 90/100
    c.use(HEALING_POTION);
    expect(c.currentHP).toBe(100);
  });

  it("heal is capped at maxHP — cannot overheal", () => {
    const c = new Character(BASE_STATS);
    c.use(HEALING_POTION); // already full
    expect(c.currentHP).toBe(100);
  });

  it("throws when trying to use a non-consumable item", () => {
    const c = new Character(BASE_STATS);
    const equippable: Item = {
      id: "boots",
      name: "Boots",
      rarity: "Common",
      kind: "equippable",
      levelReq: 1,
      slot: "boots",
      modifiers: [],
    };
    expect(() => c.use(equippable)).toThrow();
  });
});

// ── Milestone 3: Buff (timed modifier) ──────────────────────────────────────

const ATTACK_ELIXIR: Item = {
  id: "attack-elixir",
  name: "Attack Elixir",
  rarity: "Common",
  kind: "consumable",
  levelReq: 1,
  modifiers: [],
  buff: {
    id: "attack-elixir-buff",
    name: "Attack Boost",
    duration: 3,
    modifiers: [{ attribute: "attack", kind: "flat", value: 5 }],
  },
};

describe("Character.use — Buff (Milestone 3 acceptance)", () => {
  it("use Attack Elixir (+5 attack for 3 ticks) → attack becomes 15", () => {
    const c = new Character(BASE_STATS); // base attack = 10
    c.use(ATTACK_ELIXIR);
    expect(c.getStat("attack")).toBe(15);
  });

  it("advance past 3 ticks → attack returns to base 10", () => {
    const c = new Character(BASE_STATS);
    c.use(ATTACK_ELIXIR);
    c.advance(3);
    expect(c.getStat("attack")).toBe(10);
  });

  it("buff is still active one tick before expiry", () => {
    const c = new Character(BASE_STATS);
    c.use(ATTACK_ELIXIR);
    c.advance(2);
    expect(c.getStat("attack")).toBe(15);
  });

  it("re-using an active buff refreshes its timer", () => {
    const c = new Character(BASE_STATS);
    c.use(ATTACK_ELIXIR);
    c.advance(2); // 1 tick left
    c.use(ATTACK_ELIXIR); // refresh → 3 ticks left
    c.advance(2); // 1 tick left — still active
    expect(c.getStat("attack")).toBe(15);
  });

  it("getActiveBuffs lists active buffs with remaining time", () => {
    const c = new Character(BASE_STATS);
    c.use(ATTACK_ELIXIR);
    c.advance(1);
    const active = c.getActiveBuffs();
    expect(active).toHaveLength(1);
    expect(active[0].def.id).toBe("attack-elixir-buff");
    expect(active[0].remaining).toBe(2);
  });
});
