import { describe, it, expect } from "vitest";

import {
  GameSession,
  createInitialGame,
  loadGame,
  STARTER_WEAPON_BASE_ID,
  STARTER_WEAPON,
} from "./index";

import type { GameState, SavedCharacter, SavedGroup } from "../persistence";
import { Wallet } from "../domain/economy";
import { RuneState } from "../domain/runes";
import { Inventory, Stash } from "../domain/items";
import type { Item } from "../domain/items";
import { THRESHOLDS } from "../domain/cube";
import { SeededRng } from "../domain/rng";

// ── fixtures ─────────────────────────────────────────────────────────────────

/** A plain common weapon (levelReq 1) usable by a fresh hero. */
function weapon(id: string, attack = 5): Item {
  return {
    id,
    name: `Sword ${id}`,
    rarity: "Common",
    kind: "equippable",
    levelReq: 1,
    slot: "weapon",
    modifiers: [{ attribute: "attack", kind: "flat", value: attack }],
  };
}

/** A heavy sword so the party reliably clears act-1 stages quickly (mirrors offline fixtures). */
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

/** A level-10 knight wielding the greatsword, parked at act 1 / stage 1 on normal. */
function farmingSession(rng = new SeededRng(1)): GameSession {
  const knight: SavedCharacter = {
    id: "hero-1",
    name: "Aldric",
    classId: "knight",
    level: 10,
    build: {},
    equipment: { weapon: greatsword },
    attackElement: "physical",
  };
  const group: SavedGroup = {
    id: "group-1",
    capacity: 5,
    formation: ["hero-1"],
  };
  const state: GameState = {
    progression: {
      position: { actIndex: 1, stageIndex: 1 },
      difficulty: "normal",
      clearedNormalFinalActBoss: false,
    },
    wallet: new Wallet(0),
    runes: new RuneState(),
    cubeLevel: 1,
    inventory: new Inventory(100),
    stash: new Stash(1, 100),
    characters: [knight],
    groups: [group],
    heroSlots: 3,
    groupSlots: 1,
  };
  return new GameSession(state, rng);
}

// ── Slice 1: bootstrap + character ───────────────────────────────────────────

describe("GameSession — bootstrap + character", () => {
  it("creates the default game: one knight in one group, empty bags, no gold", () => {
    const session = createInitialGame(new SeededRng(1));

    expect(session.characterIds).toEqual(["hero-1"]);
    expect(session.gold).toBe(0);
    expect(session.inventoryItems).toHaveLength(0);

    // The starter Knight begins equipped with the Worn Short Sword (a barehanded
    // hero deals zero damage). It is a Common floor sword: +5 physicalDamage and
    // no attack, so the attack stat stays at the Knight's base 10.
    expect(session.character("hero-1").equipment.weapon).toEqual(
      STARTER_WEAPON,
    );
    const stats = session.statsOf("hero-1");
    expect(stats.attack).toBe(10); // Knight L1 base attack (starter adds physicalDamage)
    expect(stats.physicalDamage).toBe(5); // starter weapon +5 physicalDamage
    expect(stats.hp).toBe(100); // Knight L1 base hp
  });

  it("equips a weapon from the inventory and the character's stat rises", () => {
    const session = createInitialGame(new SeededRng(1));
    // Bare the starter weapon so the equip is an unambiguous rise from base.
    session.unequip("hero-1", "weapon");
    const sword = weapon("sword-1", 5);
    session.grantItem(sword);

    expect(session.statsOf("hero-1").attack).toBe(10);

    session.equip("hero-1", sword);

    expect(session.statsOf("hero-1").attack).toBe(15);
    expect(session.inventoryItems).not.toContain(sword);
  });

  it("hard-blocks equipping an item above the character's level", () => {
    const session = createInitialGame(new SeededRng(1));
    const highReq: Item = { ...weapon("sword-hi", 99), levelReq: 5 };
    session.grantItem(highReq);

    expect(() => session.equip("hero-1", highReq)).toThrow();
    // nothing changed: item still in the bag, stat untouched (starter weapon stays)
    expect(session.inventoryItems).toContain(highReq);
    expect(session.statsOf("hero-1").attack).toBe(10);
  });

  it("allocates a skill point into a passive and refunds it", () => {
    const session = createInitialGame(new SeededRng(1)); // L1 → 1 point

    expect(session.availablePoints("hero-1")).toBe(1);

    session.allocate("hero-1", "attack"); // +2 attack passive (on top of base 10)
    expect(session.statsOf("hero-1").attack).toBe(12);
    expect(session.availablePoints("hero-1")).toBe(0);

    session.refund("hero-1", "attack");
    expect(session.statsOf("hero-1").attack).toBe(10);
    expect(session.availablePoints("hero-1")).toBe(1);
  });

  it("rejects allocating when no points are available", () => {
    const session = createInitialGame(new SeededRng(1));
    session.allocate("hero-1", "attack");
    expect(() => session.allocate("hero-1", "hp")).toThrow();
  });
});

// ── Slice 2: battle loop ──────────────────────────────────────────────────────

describe("GameSession — battle loop", () => {
  it("plays the current stage, awarding gold + xp + a chest, and advances", () => {
    const session = farmingSession();
    const before = session.gold;

    const report = session.playStage();

    expect(report.status).toBe("cleared");
    expect(report.gold).toBeGreaterThan(0);
    expect(report.xp).toBeGreaterThan(0);
    expect(report.chests.length).toBeGreaterThanOrEqual(1);

    expect(session.gold).toBe(before + report.gold);
    expect(session.pendingChests).toHaveLength(report.chests.length);
    // a cleared latest stage advances one stage
    expect(session.position).toEqual({ actIndex: 1, stageIndex: 2 });
  });

  it("is deterministic for a fixed seed", () => {
    const a = farmingSession(new SeededRng(7)).playStage();
    const b = farmingSession(new SeededRng(7)).playStage();
    expect(b).toEqual(a);
  });
});

// ── Slice 3: loot → equip ─────────────────────────────────────────────────────

describe("GameSession — loot to equip", () => {
  it("opens a dropped chest into the inventory, then equips the loot to raise a stat", () => {
    const session = farmingSession();
    session.playStage(); // drops the guaranteed first chest (a class weapon)

    expect(session.pendingChests.length).toBeGreaterThanOrEqual(1);

    // bare the weapon slot so the looted weapon is an unambiguous upgrade from "no weapon"
    session.unequip("hero-1", "weapon");
    const noWeaponAttack = session.statsOf("hero-1").attack;

    const looted = session.openChest();
    expect(session.inventoryItems).toContain(looted);
    expect(looted.slot).toBe("weapon"); // first chest = guaranteed class weapon
    expect(looted.kind).toBe("equippable");

    session.equip("hero-1", looted);
    expect(session.statsOf("hero-1").attack).toBeGreaterThan(noWeaponAttack);
  });

  it("refuses to open a chest when the inventory is full", () => {
    const session = farmingSession(new SeededRng(2));
    session.playStage();
    // fill the inventory to capacity
    while (
      session.grantItem(weapon(`filler-${session.inventoryItems.length}`))
    ) {
      /* keep filling until add() returns false */
    }
    expect(() => session.openChest()).toThrow();
  });
});

// ── Slice 4: cube + runes ─────────────────────────────────────────────────────

describe("GameSession — cube + runes", () => {
  it("synthesizes 3 same-rarity items into one of the next tier", () => {
    const session = createInitialGame(new SeededRng(1));
    const inputs = [weapon("a"), weapon("b"), weapon("c")];
    inputs.forEach((i) => session.grantItem(i));

    const result = session.synthesize(inputs, THRESHOLDS[0]); // band 1–10

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.rarity).toBe("Uncommon");
    // the three inputs were consumed, the fresh output remains
    inputs.forEach((i) => expect(session.inventoryItems).not.toContain(i));
    expect(session.inventoryItems).toContain(result.item);
  });

  it("sells an item for gold (overview anchor: L1 common = 10g)", () => {
    const session = createInitialGame(new SeededRng(1));
    const item = weapon("sellme");
    session.grantItem(item);

    const value = session.sell(item);

    expect(value).toBe(10);
    expect(session.gold).toBe(10);
    expect(session.inventoryItems).not.toContain(item);
  });

  it("buys a rune node, spending gold and raising its level", () => {
    const session = createInitialGame(new SeededRng(1));
    session.addGold(100);

    const cost = session.buyRune("awakening"); // root, cost 100 at level 0

    expect(cost).toBe(100);
    expect(session.gold).toBe(0);
    expect(session.runeLevel("awakening")).toBe(1);
  });

  it("rejects buying a rune the player cannot afford", () => {
    const session = createInitialGame(new SeededRng(1));
    expect(() => session.buyRune("awakening")).toThrow();
    expect(session.runeLevel("awakening")).toBe(0);
  });
});

// ── Slice 5: save / load + offline ────────────────────────────────────────────

describe("GameSession — persistence + offline", () => {
  it("round-trips a mutated game through save / load", () => {
    const session = createInitialGame(new SeededRng(1));
    session.grantItem(weapon("kept"));
    const worn = weapon("worn");
    session.grantItem(worn);
    session.equip("hero-1", worn);

    const save = session.save();
    const loaded = loadGame(save, new SeededRng(1));

    expect(loaded.save()).toEqual(save);
  });

  it("applies offline progress: gold and items land in the live state", () => {
    const session = farmingSession();
    const beforeGold = session.gold;
    const beforeItems = session.inventoryItems.length;

    const report = session.simulateOffline(60_000);

    expect(report.gold).toBeGreaterThan(0);
    expect(session.gold).toBe(beforeGold + report.gold);
    expect(session.inventoryItems.length).toBe(
      beforeItems + report.items.length,
    );
  });

  it("offline simulation is deterministic for a fixed seed", () => {
    const a = farmingSession(new SeededRng(9)).simulateOffline(45_000);
    const b = farmingSession(new SeededRng(9)).simulateOffline(45_000);
    expect(b).toEqual(a);
  });
});

// ── UI read accessors (the seam the shell renders) ────────────────────────────

describe("GameSession — UI read accessors", () => {
  it("exposes a character recipe (class / level / build / equipment)", () => {
    const session = createInitialGame(new SeededRng(1));
    const hero = session.character("hero-1");
    expect(hero.classId).toBe("knight");
    expect(hero.level).toBe(1);
    expect(hero.build).toEqual({});
    expect(hero.equipment).toEqual({ weapon: STARTER_WEAPON });
  });

  it("reflects allocations in the character recipe's build", () => {
    const session = createInitialGame(new SeededRng(1));
    session.allocate("hero-1", "attack");
    expect(session.character("hero-1").build).toEqual({ attack: 1 });
  });

  it("throws for an unknown character id", () => {
    const session = createInitialGame(new SeededRng(1));
    expect(() => session.character("nobody")).toThrow();
  });

  it("exposes difficulty, groups and inventory capacity", () => {
    const session = createInitialGame(new SeededRng(1));
    expect(session.difficulty).toBe("normal");
    expect(session.groups.map((g) => g.id)).toEqual(["group-1"]);
    expect(session.inventoryCapacity).toBe(40);
  });

  it("grants a freshly generated item to the inventory (dev helper)", () => {
    const session = createInitialGame(new SeededRng(1));
    const item = session.grantRandomItem(5);
    expect(item).toBeDefined();
    expect(session.inventoryItems).toContain(item);
    expect(item?.itemLevel).toBe(5);
  });
});

// keep the imported constant referenced (guards against accidental removal)
it("exposes the starter weapon base id", () => {
  expect(STARTER_WEAPON_BASE_ID).toBe("short-sword");
});
