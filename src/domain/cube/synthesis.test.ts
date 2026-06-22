import { describe, it, expect } from "vitest";
import { SeededRng } from "../rng/seeded-rng";
import type { Item } from "../items/item";
import type { Rarity } from "../items/rarity";
import { synthesize, SYNTHESIS_RATIO } from "./synthesis";
import type { Threshold } from "./threshold";

const BAND: Threshold = { min: 1, max: 10 };

const equip = (over: Partial<Item> = {}): Item => ({
  id: "in",
  name: "Input",
  rarity: "Common",
  kind: "equippable",
  levelReq: 1,
  itemLevel: 5,
  slot: "weapon",
  modifiers: [{ attribute: "attack", kind: "flat", value: 7 }],
  ...over,
});

const three = (over: Partial<Item> = {}): Item[] => [
  equip({ ...over, id: "a" }),
  equip({ ...over, id: "b" }),
  equip({ ...over, id: "c" }),
];

describe("synthesize", () => {
  it("turns 3 commons into 1 fresh uncommon", () => {
    const res = synthesize(new SeededRng(1), three(), { threshold: BAND });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.item.rarity).toBe<Rarity>("Uncommon");
    expect(res.item.kind).toBe("equippable");
    // Fresh roll: not one of the input ids.
    expect(["a", "b", "c"]).not.toContain(res.item.id);
  });

  it("is deterministic under a seed (fresh roll, not inherited)", () => {
    const a = synthesize(new SeededRng(42), three(), { threshold: BAND });
    const b = synthesize(new SeededRng(42), three(), { threshold: BAND });
    expect(a).toEqual(b);
  });

  it("outputs at the highest input item level", () => {
    const items = [
      equip({ id: "a", itemLevel: 3 }),
      equip({ id: "b", itemLevel: 7 }),
      equip({ id: "c", itemLevel: 5 }),
    ];
    const res = synthesize(new SeededRng(1), items, { threshold: BAND });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.item.itemLevel).toBe(7);
  });

  it("honors a custom ratio", () => {
    const res = synthesize(new SeededRng(1), [equip(), equip()], {
      threshold: BAND,
      ratio: 2,
    });
    expect(res.ok).toBe(true);
  });

  it("rejects the wrong number of inputs", () => {
    const res = synthesize(new SeededRng(1), [equip(), equip()], {
      threshold: BAND,
    });
    expect(res).toEqual({ ok: false, reason: "wrong-count" });
    expect(SYNTHESIS_RATIO).toBe(3);
  });

  it("rejects mixed rarities", () => {
    const items = three();
    items[2] = equip({ id: "c", rarity: "Rare" });
    const res = synthesize(new SeededRng(1), items, { threshold: BAND });
    expect(res).toEqual({ ok: false, reason: "mixed-rarity" });
  });

  it("rejects mixed kinds", () => {
    const items = three();
    items[2] = { ...equip({ id: "c" }), kind: "misc" };
    const res = synthesize(new SeededRng(1), items, { threshold: BAND });
    expect(res).toEqual({ ok: false, reason: "mixed-kind" });
  });

  it("rejects unsupported (non-equippable) kinds", () => {
    const misc: Item = {
      id: "m",
      name: "Junk",
      rarity: "Common",
      kind: "misc",
      levelReq: 1,
      itemLevel: 5,
      modifiers: [],
    };
    const res = synthesize(
      new SeededRng(1),
      [misc, { ...misc, id: "m2" }, { ...misc, id: "m3" }],
      {
        threshold: BAND,
      },
    );
    expect(res).toEqual({ ok: false, reason: "unsupported-kind" });
  });

  it("rejects synthesizing the top rarity", () => {
    const res = synthesize(new SeededRng(1), three({ rarity: "Legendary" }), {
      threshold: BAND,
    });
    expect(res).toEqual({ ok: false, reason: "max-rarity" });
  });

  it("rejects inputs outside the selected threshold band", () => {
    const res = synthesize(new SeededRng(1), three({ itemLevel: 15 }), {
      threshold: BAND,
    });
    expect(res).toEqual({ ok: false, reason: "out-of-threshold" });
  });
});
