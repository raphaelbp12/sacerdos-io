import { describe, it, expect } from "vitest";
import { Equipment } from "./equipment";
import { EQUIPMENT_SLOTS } from "./equipment-slot";
import type { Item } from "./item";
import { Character } from "../stats/character";

const BASE_STATS = { HP: 100, MP: 50, STR: 8, AGI: 10, INT: 6 };

const BOOTS_OF_AGILITY: Item = {
  id: "boots-of-agility",
  name: "Boots of Agility",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  slot: "boots",
  modifiers: [{ attribute: "AGI", kind: "flat", value: 5 }],
};

const SWIFT_BOOTS: Item = {
  id: "swift-boots",
  name: "Swift Boots",
  rarity: "Uncommon",
  kind: "equippable",
  levelReq: 1,
  slot: "boots",
  modifiers: [{ attribute: "AGI", kind: "flat", value: 8 }],
};

const HEALTH_POTION: Item = {
  id: "health-potion",
  name: "Health Potion",
  rarity: "Common",
  kind: "consumable",
  levelReq: 1,
  modifiers: [],
};

describe("EQUIPMENT_SLOTS", () => {
  it("contains exactly the 7 locked slots", () => {
    expect(EQUIPMENT_SLOTS).toHaveLength(7);
    expect([...EQUIPMENT_SLOTS].sort()).toEqual([
      "amulet",
      "body",
      "boots",
      "gloves",
      "helm",
      "ring",
      "weapon",
    ]);
  });
});

describe("Equipment.equip / unequip", () => {
  it("returns no modifiers when empty", () => {
    expect(new Equipment().getModifiers()).toHaveLength(0);
  });

  it("provides the equipped item's modifiers via getModifiers", () => {
    const equipment = new Equipment();
    equipment.equip(BOOTS_OF_AGILITY, 1);
    expect(equipment.getModifiers()).toContainEqual({
      attribute: "AGI",
      kind: "flat",
      value: 5,
    });
  });

  it("unequip removes the item and clears its modifiers", () => {
    const equipment = new Equipment();
    equipment.equip(BOOTS_OF_AGILITY, 1);
    equipment.unequip("boots");
    expect(equipment.getModifiers()).toHaveLength(0);
  });

  it("unequip returns the removed item", () => {
    const equipment = new Equipment();
    equipment.equip(BOOTS_OF_AGILITY, 1);
    expect(equipment.unequip("boots")).toBe(BOOTS_OF_AGILITY);
  });

  it("unequip on an empty slot returns undefined", () => {
    expect(new Equipment().unequip("boots")).toBeUndefined();
  });

  it("equipping into an occupied slot displaces the old item", () => {
    const equipment = new Equipment();
    equipment.equip(BOOTS_OF_AGILITY, 1);
    const displaced = equipment.equip(SWIFT_BOOTS, 1);
    expect(displaced).toBe(BOOTS_OF_AGILITY);
  });

  it("after a swap only the new item's modifiers are active", () => {
    const equipment = new Equipment();
    equipment.equip(BOOTS_OF_AGILITY, 1);
    equipment.equip(SWIFT_BOOTS, 1);
    const mods = equipment.getModifiers();
    expect(mods).toHaveLength(1);
    expect(mods[0].value).toBe(8);
  });

  it("getEquipped returns the item in a slot", () => {
    const equipment = new Equipment();
    equipment.equip(BOOTS_OF_AGILITY, 1);
    expect(equipment.getEquipped("boots")).toBe(BOOTS_OF_AGILITY);
  });

  it("getEquipped returns undefined for an empty slot", () => {
    expect(new Equipment().getEquipped("boots")).toBeUndefined();
  });

  it("throws when equipping a non-equippable item", () => {
    expect(() => new Equipment().equip(HEALTH_POTION, 1)).toThrow();
  });

  it("throws when character level is below the item level requirement (hard block)", () => {
    const highLevelBoots: Item = {
      ...BOOTS_OF_AGILITY,
      id: "boots-lvl10",
      levelReq: 10,
    };
    expect(() => new Equipment().equip(highLevelBoots, 5)).toThrow();
  });
});

describe("Equipment + Character integration (Milestone 2 acceptance tests)", () => {
  it("equip Boots of Agility (+5 AGI) → character AGI becomes 15", () => {
    const equipment = new Equipment();
    const character = new Character(BASE_STATS, [equipment]);
    equipment.equip(BOOTS_OF_AGILITY, 1);
    expect(character.getStat("AGI")).toBe(15);
  });

  it("unequip Boots of Agility → character AGI returns to 10", () => {
    const equipment = new Equipment();
    const character = new Character(BASE_STATS, [equipment]);
    equipment.equip(BOOTS_OF_AGILITY, 1);
    expect(character.getStat("AGI")).toBe(15);
    equipment.unequip("boots");
    expect(character.getStat("AGI")).toBe(10);
  });

  it("equipping into an occupied slot swaps item and recomputes stats", () => {
    const equipment = new Equipment();
    const character = new Character(BASE_STATS, [equipment]);
    equipment.equip(BOOTS_OF_AGILITY, 1);
    expect(character.getStat("AGI")).toBe(15);
    equipment.equip(SWIFT_BOOTS, 1);
    expect(character.getStat("AGI")).toBe(18);
  });
});
