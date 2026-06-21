import { describe, it, expect } from "vitest";
import { Character } from "../stats";
import { KNIGHT_PASSIVES, PassiveAllocation } from "./passive-def";

describe("KNIGHT_PASSIVES data", () => {
  it("has 7 passives with unique ids", () => {
    const ids = KNIGHT_PASSIVES.map((p) => p.id);
    expect(ids.length).toBe(7);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("splits passives 2/2/2/1 across the four bands", () => {
    const counts = [1, 2, 3, 4].map(
      (b) => KNIGHT_PASSIVES.filter((p) => p.band === b).length,
    );
    expect(counts).toEqual([2, 2, 2, 1]);
  });

  it("caps the elemental-resistance passive at 5 ranks, others at 10", () => {
    const elem = KNIGHT_PASSIVES.find((p) => p.id === "elemental-resist");
    expect(elem!.maxRank).toBe(5);
    for (const p of KNIGHT_PASSIVES) {
      if (p.id !== "elemental-resist") expect(p.maxRank).toBe(10);
    }
  });
});

describe("PassiveAllocation as a ModifierSource", () => {
  it("emits nothing for an empty / zero allocation", () => {
    expect(new PassiveAllocation({}).getModifiers()).toEqual([]);
    expect(new PassiveAllocation({ attack: 0 }).getModifiers()).toEqual([]);
  });

  it("increase-attack rank 10 yields +20 attack via getStat", () => {
    const c = new Character({}, [new PassiveAllocation({ attack: 10 })]);
    expect(c.getStat("attack")).toBe(20);
  });

  it("increase-hp rank 3 yields +45 hp", () => {
    const c = new Character({}, [new PassiveAllocation({ hp: 3 })]);
    expect(c.getStat("hp")).toBe(45);
  });

  it("increase-damage rank 10 yields +0.30 to the damage multiplier", () => {
    const c = new Character({}, [new PassiveAllocation({ damage: 10 })]);
    expect(c.getStat("damage")).toBeCloseTo(0.3);
  });

  it("attack-speed rank 5 multiplies the 1.0 base by +10%", () => {
    const c = new Character({}, [new PassiveAllocation({ "attack-speed": 5 })]);
    expect(c.getStat("attackSpeed")).toBeCloseTo(1.1);
  });

  it("elemental-resist rank 5 adds +0.50 to all four resists", () => {
    const c = new Character({}, [
      new PassiveAllocation({ "elemental-resist": 5 }),
    ]);
    expect(c.getStat("fireResist")).toBeCloseTo(0.5);
    expect(c.getStat("coldResist")).toBeCloseTo(0.5);
    expect(c.getStat("lightningResist")).toBeCloseTo(0.5);
    expect(c.getStat("chaosResist")).toBeCloseTo(0.5);
  });

  it("ignores unknown passive ids", () => {
    expect(new PassiveAllocation({ nonsense: 9 }).getModifiers()).toEqual([]);
  });
});
