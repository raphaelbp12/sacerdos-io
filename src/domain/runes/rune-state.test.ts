import { describe, it, expect } from "vitest";
import { RuneState } from "./rune-state";
import { RUNE_TREE } from "./rune-tree";
import { runeCostAt, type RunePerk, type RuneNode } from "./rune-node";
import { Character } from "../stats";

describe("RUNE_TREE shape", () => {
  it("has exactly one depth-0 root and two depth-1 branches", () => {
    expect(RUNE_TREE.filter((n) => n.depth === 0)).toHaveLength(1);
    expect(RUNE_TREE.filter((n) => n.depth === 1)).toHaveLength(2);
  });

  it("has unique node ids", () => {
    const ids = RUNE_TREE.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every RunePerk at least once", () => {
    const allPerks: RunePerk[] = [
      "expPercent",
      "expFlatMonster",
      "expFlatBoss",
      "goldPercent",
      "goldFlatMonster",
      "goldFlatBoss",
      "dropChance",
      "chestCapacity",
      "inventorySlots",
      "stashTabs",
      "respawnFlatMs",
      "respawnPercent",
      "cubeExpPercent",
      "skillSlots",
      "heroSlots",
      "groupSlots",
    ];
    const present = new Set(
      RUNE_TREE.filter((n) => n.effect.kind === "perk").map((n) =>
        n.effect.kind === "perk" ? n.effect.perk : "",
      ),
    );
    for (const perk of allPerks) {
      expect(present.has(perk)).toBe(true);
    }
  });
});

describe("RuneState buying & levels", () => {
  it("starts every node at level 0", () => {
    const runes = new RuneState();
    expect(runes.levelOf("might")).toBe(0);
  });

  it("buy increments the level and returns the cost ladder from runeCostAt", () => {
    const runes = new RuneState();
    const might = RUNE_TREE.find((n) => n.id === "might")!;
    expect(runes.costToBuy("might")).toBe(runeCostAt(might, 0));
    expect(runes.buy("might")).toBe(runeCostAt(might, 0));
    expect(runes.levelOf("might")).toBe(1);
    expect(runes.costToBuy("might")).toBe(runeCostAt(might, 1));
  });

  it("enforces max level", () => {
    const node: RuneNode = {
      id: "tiny",
      label: "Tiny",
      branch: 1,
      depth: 0,
      maxLevel: 1,
      baseCost: 10,
      effect: { kind: "stat", stat: "hp", modifierKind: "flat", perLevel: 1 },
    };
    const runes = new RuneState([node]);
    runes.buy("tiny");
    expect(runes.isMaxed("tiny")).toBe(true);
    expect(() => runes.buy("tiny")).toThrow(/max level/);
    expect(() => runes.costToBuy("tiny")).toThrow(/max level/);
  });

  it("throws for an unknown node", () => {
    const runes = new RuneState();
    expect(() => runes.buy("nope")).toThrow(/unknown/);
  });
});

describe("RuneState as a stat ModifierSource", () => {
  it("raises a global stat on a Character via getStat", () => {
    const runes = new RuneState();
    const hero = new Character({ attack: 10 }, [runes]);
    expect(hero.getStat("attack")).toBe(10);

    runes.buy("might"); // +5 flat attack per level
    expect(hero.getStat("attack")).toBe(15);
    runes.buy("might");
    expect(hero.getStat("attack")).toBe(20);
  });

  it("applies a percentage stat node multiplicatively", () => {
    const runes = new RuneState();
    const hero = new Character({ hp: 100 }, [runes]);
    runes.buy("vitality"); // +2% hp per level
    expect(hero.getStat("hp")).toBeCloseTo(102);
  });
});
