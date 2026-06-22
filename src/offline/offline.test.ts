import { describe, it, expect } from "vitest";

import { simulateElapsed, DEFAULT_OFFLINE_CEILING_MS } from "./index";
import type { GameState, SavedCharacter, SavedGroup } from "../persistence";

import { Wallet } from "../domain/economy";
import { RuneState } from "../domain/runes";
import { Inventory, Stash } from "../domain/items";
import type { Item } from "../domain/items";
import { SeededRng } from "../domain/rng";

// ── fixtures ─────────────────────────────────────────────────────────────────

/** A heavy sword so the party reliably clears act-1 stages quickly. */
const greatsword: Item = {
  id: "greatsword-1",
  name: "Greatsword",
  rarity: "Rare",
  kind: "equippable",
  levelReq: 1,
  slot: "weapon",
  modifiers: [
    { attribute: "attack", kind: "flat", value: 200 },
    { attribute: "physicalDamage", kind: "flat", value: 120 },
  ],
};

const knight: SavedCharacter = {
  id: "hero-1",
  name: "Aldric",
  classId: "knight",
  level: 10,
  build: {},
  equipment: { weapon: greatsword },
  attackElement: "physical",
};

const party: SavedGroup = {
  id: "group-1",
  capacity: 5,
  formation: ["hero-1"],
};

/** A populated state parked at Act 1 / Stage 1 on normal. `inventoryCapacity` is tunable. */
function farmingState(inventoryCapacity: number = 100): GameState {
  return {
    progression: {
      position: { actIndex: 1, stageIndex: 1 },
      difficulty: "normal",
      clearedNormalFinalActBoss: false,
    },
    wallet: new Wallet(0),
    runes: new RuneState(),
    cubeLevel: 1,
    inventory: new Inventory(inventoryCapacity),
    stash: new Stash(1, 100),
    characters: [knight],
    groups: [party],
    heroSlots: 3,
    groupSlots: 1,
  };
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("simulateElapsed", () => {
  it("farms the current stage, earning gold + xp + chest items", () => {
    const report = simulateElapsed(farmingState(), 60_000, new SeededRng(1));

    expect(report.elapsedMs).toBe(60_000);
    expect(report.stagesCleared).toBeGreaterThan(0);
    expect(report.gold).toBeGreaterThan(0);
    expect(report.xp).toBeGreaterThan(0);
    // one chest item per cleared stage, all fitting in a roomy inventory.
    expect(report.items).toHaveLength(report.stagesCleared);
    expect(report.itemsLost).toBe(0);
  });

  it("is deterministic for a fixed elapsed time + seed", () => {
    const a = simulateElapsed(farmingState(), 45_000, new SeededRng(7));
    const b = simulateElapsed(farmingState(), 45_000, new SeededRng(7));
    expect(b).toEqual(a);
  });

  it("rewards scale with the time given", () => {
    const short = simulateElapsed(farmingState(), 30_000, new SeededRng(3));
    const long = simulateElapsed(farmingState(), 90_000, new SeededRng(3));

    expect(long.stagesCleared).toBeGreaterThanOrEqual(short.stagesCleared);
    expect(long.gold).toBeGreaterThanOrEqual(short.gold);
  });

  it("caps kept items at the inventory's free slots, counting the overflow as lost", () => {
    const report = simulateElapsed(farmingState(2), 120_000, new SeededRng(5));

    expect(report.stagesCleared).toBeGreaterThan(2);
    expect(report.items).toHaveLength(2);
    expect(report.itemsLost).toBe(report.stagesCleared - 2);
  });

  it("clamps a huge elapsed time to the offline ceiling", () => {
    const report = simulateElapsed(
      farmingState(),
      DEFAULT_OFFLINE_CEILING_MS * 10,
      new SeededRng(1),
      { ceilingMs: 1000 },
    );
    expect(report.elapsedMs).toBe(1000);
  });

  it("returns an empty report for zero elapsed time", () => {
    const report = simulateElapsed(farmingState(), 0, new SeededRng(1));
    expect(report).toEqual({
      elapsedMs: 0,
      stagesCleared: 0,
      gold: 0,
      xp: 0,
      items: [],
      itemsLost: 0,
    });
  });

  it("earns nothing when there is no group to field", () => {
    const state = farmingState();
    const empty: GameState = { ...state, groups: [] };
    const report = simulateElapsed(empty, 60_000, new SeededRng(1));

    expect(report.stagesCleared).toBe(0);
    expect(report.gold).toBe(0);
    expect(report.items).toEqual([]);
  });
});
