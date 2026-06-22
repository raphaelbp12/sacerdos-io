import { describe, it, expect } from "vitest";
import { RuneState } from "./rune-state";

import { goldForKill } from "../economy/gold";
import { effectiveRespawnMs } from "../revive/respawn";
import { cubeExpForItem } from "../cube/cube-exp";
import { Inventory } from "../items/inventory";
import { ChestInventory } from "../loot/chest-inventory";
import type { Item } from "../items/item";

/**
 * M18.2 — every account-wide system reads its rune perk through the structural adapters on
 * `RuneState` (no sibling imports). These tests drive the *real* hooks, not mocks.
 */

const sampleItem: Item = {
  id: "sword",
  name: "Test Sword",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  itemLevel: 1,
  slot: "weapon",
  modifiers: [],
};

describe("rune hooks", () => {
  it("gold — goldForKill reads goldModifiersFor", () => {
    const runes = new RuneState();
    const before = goldForKill(
      "weakMonster",
      1,
      runes.goldModifiersFor("monster"),
    );
    expect(before).toBe(1); // no runes → base only

    runes.buy("avarice"); // +1 flat gold per monster
    runes.buy("fortune"); // +5% gold
    const after = goldForKill(
      "weakMonster",
      1,
      runes.goldModifiersFor("monster"),
    );
    // (1 base + 1 flat) × 1.05 = 2.1 → floor 2
    expect(after).toBe(2);
    expect(after).toBeGreaterThan(before);
  });

  it("gold — boss flat perk only applies to boss kills", () => {
    const runes = new RuneState();
    runes.buy("plunder"); // +10 flat gold per boss
    expect(runes.goldModifiersFor("boss").flat).toBe(10);
    expect(runes.goldModifiersFor("monster").flat).toBe(0);
  });

  it("respawn — effectiveRespawnMs reads respawnReduction", () => {
    const runes = new RuneState();
    const baseline = effectiveRespawnMs(runes.respawnReduction());
    runes.buy("resilience"); // -5000 ms flat
    runes.buy("rebirth"); // -3%
    const reduced = effectiveRespawnMs(runes.respawnReduction());
    expect(reduced).toBeLessThan(baseline);
    // (120000 - 5000) × (1 - 0.03) = 111550
    expect(reduced).toBe(111_550);
  });

  it("cube EXP — cubeExpForItem reads cubeExpOptions", () => {
    const runes = new RuneState();
    const before = cubeExpForItem(sampleItem, 1, runes.cubeExpOptions());
    runes.buy("transmutation"); // +5% cube EXP
    const after = cubeExpForItem(sampleItem, 1, runes.cubeExpOptions());
    expect(after).toBeGreaterThanOrEqual(before);
    expect(runes.cubeExpOptions().expBonus).toBeCloseTo(0.05);
  });

  it("inventory — capacity grows with inventorySlots", () => {
    const runes = new RuneState();
    runes.buy("satchel"); // +5 slots
    const inv = new Inventory(runes.inventoryCapacity(10));
    expect(inv.capacity).toBe(15);
  });

  it("drops — chest capacity grows with chestCapacity; drop chance bonus is exposed", () => {
    const runes = new RuneState();
    runes.buy("hoard"); // +5 chest capacity
    const chests = new ChestInventory(runes.chestCapacity(20));
    expect(chests.capacity).toBe(25);

    runes.buy("greed"); // +5% drop chance
    expect(runes.dropChanceBonus()).toBeCloseTo(0.05);
  });

  it("QoL — slot getters add onto a base", () => {
    const runes = new RuneState();
    runes.buy("discipline"); // +1 skill slot
    runes.buy("fellowship"); // +1 hero slot
    runes.buy("warband"); // +1 group slot
    expect(runes.skillSlots(4)).toBe(5);
    expect(runes.heroSlots(3)).toBe(4);
    expect(runes.groupSlots(1)).toBe(2);
  });
});
