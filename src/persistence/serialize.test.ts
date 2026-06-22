import { describe, it, expect } from "vitest";

import {
  serialize,
  deserialize,
  buildRoster,
  buildGroupRoster,
  SAVE_VERSION,
  type GameState,
  type SaveState,
  type SavedCharacter,
  type SavedGroup,
} from "./index";

import { Wallet } from "../domain/economy";
import { RuneState } from "../domain/runes";
import { Inventory, Stash } from "../domain/items";
import type { Item } from "../domain/items";

// ── fixtures ─────────────────────────────────────────────────────────────────

const sword: Item = {
  id: "sword-1",
  name: "Short Sword",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  slot: "weapon",
  modifiers: [{ attribute: "attack", kind: "flat", value: 5 }],
};

const helm: Item = {
  id: "helm-1",
  name: "Iron Helm",
  rarity: "Uncommon",
  kind: "equippable",
  levelReq: 1,
  slot: "helm",
  modifiers: [{ attribute: "armor", kind: "flat", value: 8 }],
};

const potion: Item = {
  id: "potion-1",
  name: "Health Potion",
  rarity: "Common",
  kind: "misc",
  levelReq: 1,
  modifiers: [],
};

const knight: SavedCharacter = {
  id: "hero-1",
  name: "Aldric",
  classId: "knight",
  level: 5,
  build: { hp: 2, attack: 1 },
  equipment: { weapon: sword, helm },
  skills: [{ id: "smash", rank: 3 }],
  attackElement: "physical",
};

const squire: SavedCharacter = {
  id: "hero-2",
  name: "Bryn",
  classId: "knight",
  level: 2,
  build: {},
  equipment: {},
};

const vanguard: SavedGroup = {
  id: "group-1",
  capacity: 5,
  formation: ["hero-2", "hero-1"], // front = hero-2
};

/** A fully-populated live game state touching every persisted system. */
function populatedState(): GameState {
  const wallet = new Wallet(1234);

  const runes = new RuneState();
  runes.buy("fellowship");
  runes.buy("fellowship");
  runes.buy("warband");

  const inventory = new Inventory(20);
  inventory.add(potion);
  inventory.add({ ...potion }); // stacks with potion (same id, misc)
  inventory.add(sword);

  const stash = new Stash(2, 30);
  stash.tabs[0].add(helm);
  stash.tabs[1].add(potion);

  return {
    progression: {
      position: { actIndex: 2, stageIndex: 3 },
      difficulty: "hard",
      clearedNormalFinalActBoss: true,
    },
    wallet,
    runes,
    cubeLevel: 4,
    inventory,
    stash,
    characters: [knight, squire],
    groups: [vanguard],
    heroSlots: 4,
    groupSlots: 2,
  };
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("serialize", () => {
  it("flattens a populated state to a JSON-safe, Infinity-free object", () => {
    const save = serialize(populatedState());
    const json = JSON.stringify(save);

    expect(save.version).toBe(SAVE_VERSION);
    // round-trips through JSON without losing anything (no Infinity / functions).
    expect(JSON.parse(json)).toEqual(save);
  });

  it("encodes unlimited (Infinity) capacities as null", () => {
    const state = populatedState();
    const unlimited: GameState = { ...state, inventory: new Inventory() };
    const save = serialize(unlimited);
    expect(save.inventory.capacity).toBeNull();
  });

  it("omits untouched rune nodes (sparse levels)", () => {
    const save = serialize(populatedState());
    expect(save.runes.levels).toEqual({ fellowship: 2, warband: 1 });
  });
});

describe("deserialize", () => {
  it("round-trips a populated state through JSON with deep equality", () => {
    const original = serialize(populatedState());
    const reloaded = serialize(
      deserialize(JSON.parse(JSON.stringify(original)) as SaveState),
    );
    expect(reloaded).toEqual(original);
  });

  it("rebuilds live wallet / runes / inventory / stash", () => {
    const state = deserialize(serialize(populatedState()));

    expect(state.wallet.balance).toBe(1234);
    expect(state.runes.levelOf("fellowship")).toBe(2);
    expect(state.runes.levelOf("warband")).toBe(1);
    // potion ×2 stack + sword = 2 slots; capacity preserved.
    expect(state.inventory.capacity).toBe(20);
    expect(state.inventory.slotsUsed).toBe(2);
    expect(state.stash.tabs).toHaveLength(2);
    expect(state.stash.tabs[0].items[0]?.id).toBe("helm-1");
  });

  it("rejects an unsupported save version", () => {
    const bad = { ...serialize(populatedState()), version: 999 } as SaveState;
    expect(() => deserialize(bad)).toThrow(/unsupported save version/i);
  });
});

describe("buildRoster / buildGroupRoster", () => {
  it("rehydrates combatants whose stats reflect class + level + build + gear", () => {
    const state = deserialize(serialize(populatedState()));
    const roster = buildRoster(state);

    const aldric = roster.get("hero-1");
    expect(aldric).toBeDefined();
    // Knight L5 base hp = 100 + 10*(5-1) = 140; +2 ranks of the hp passive raise it.
    const baselineHp = 100 + 10 * (5 - 1);
    expect(aldric!.combatant.getStat("hp")).toBeGreaterThan(baselineHp);
    // Knight L5 base attack = 10 + 1*4 = 14; +5 from the sword, + attack passive rank.
    expect(aldric!.combatant.getStat("attack")).toBeGreaterThan(14 + 5);
    expect(aldric!.skills?.[0]?.def.id).toBe("smash");
  });

  it("preserves formation order (front = index 0)", () => {
    const state = deserialize(serialize(populatedState()));
    const groups = buildGroupRoster(state);

    const group = groups.get("group-1");
    expect(group).toBeDefined();
    expect(group!.formation).toEqual(["hero-2", "hero-1"]);
  });

  it("respects the persisted slot capacities", () => {
    const state = deserialize(serialize(populatedState()));
    expect(buildRoster(state).capacity).toBe(4);
    expect(buildGroupRoster(state).capacity).toBe(2);
  });
});
